import { useEffect, useMemo, useState } from "react";
import {
  createAchAuthorization,
  extractBankToken,
  extractJwtToken,
  extractPaymentId,
  fetchCustomerBanks,
  fetchSessionKey,
  formatApiError,
  postAchCheckout,
  postCheckoutJwtToken,
  postCheckoutTotals,
  postCustomerBankAccount,
  putAchAuthorizationStatus,
  revokeAchAuthorization,
  type AchAuthorization,
  type LinkedBankAccount,
} from "./api";
import {
  CATALOG,
  MERCHANT_NAME,
  MERCHANT_SUPPORT,
  buildAuthorizationText,
  buildStructuredTerms,
  cancelLabel,
  catalogCtaLabel,
  catalogPriceLabel,
  confirmCtaLabel,
  orderTypeLabel,
  receiptTitle,
  type CatalogItem,
} from "./catalog";
import { buildTermsAndConditions } from "./esignConsent";

const HAS_API_KEY = Boolean(import.meta.env.VITE_COINFLOW_API_KEY?.trim());

type Screen = "signin" | "shop" | "checkout" | "receipt" | "account" | "terms";

type StoredAuth = {
  authorization: AchAuthorization;
  item: CatalogItem;
  paymentId: string | null;
  amountCents: number;
  bankLast4?: string;
  consentedAt: string;
  receiptText: string;
};

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function userIdFromEmail(value: string): string {
  return value.trim().toLowerCase();
}

function loadStore(userId: string): StoredAuth[] {
  try {
    const raw = localStorage.getItem(`harbor.auths.${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as StoredAuth[];
  } catch {
    return [];
  }
}

function saveStore(userId: string, items: StoredAuth[]) {
  localStorage.setItem(`harbor.auths.${userId}`, JSON.stringify(items));
}

function friendlyError(message: string): string {
  if (/VITE_|API_KEY|\.env/i.test(message)) {
    return "We're having trouble connecting right now. Please try again later.";
  }
  return message;
}

export function App() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [sessionAuthRef, setSessionAuthRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [banks, setBanks] = useState<LinkedBankAccount[]>([]);
  const [bankToken, setBankToken] = useState("");
  const [showAddBank, setShowAddBank] = useState(false);
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankAlias, setBankAlias] = useState("Checking");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [consented, setConsented] = useState(false);
  const [esignAccepted, setEsignAccepted] = useState(false);
  const [termsReturn, setTermsReturn] = useState<Screen>("signin");
  const [totalsLabel, setTotalsLabel] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<StoredAuth | null>(null);
  const [history, setHistory] = useState<StoredAuth[]>([]);

  const disclosure = useMemo(() => {
    if (!item) return "";
    return buildAuthorizationText({
      orderType: item.orderType,
      amountCents: item.amountCents,
      productTitle: item.title,
      orderLabel:
        item.orderType === "one_time_purchase"
          ? `Order #${item.id.toUpperCase().replace(/-/g, "")}`
          : item.title,
      frequency: item.frequency,
      topUpTriggerCents: item.topUpTriggerCents,
      topUpMaxCents: item.topUpMaxCents,
      bidPriceCents: item.bidPriceCents,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      maximumTotalCents: item.maximumTotalCents,
      minFairValueCents: item.minFairValueCents,
      maxFairValueCents: item.maxFairValueCents,
    });
  }, [item]);

  useEffect(() => {
    if (!userId.trim()) return;
    setHistory(loadStore(userId.trim()));
  }, [userId]);

  async function signIn() {
    if (!HAS_API_KEY) {
      setError(friendlyError("VITE_COINFLOW_API_KEY missing"));
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    if (!esignAccepted) {
      setError(
        `Please agree to ${MERCHANT_NAME}'s Terms & Conditions to continue.`
      );
      return;
    }
    const uid = userIdFromEmail(email);
    setBusy(true);
    setError(null);
    try {
      const key = await fetchSessionKey(uid);
      setUserId(uid);
      setSessionKey(key);
      setSessionAuthRef(`sess_${uuid().slice(0, 10)}`);
      const list = await fetchCustomerBanks(key).catch(() => []);
      setBanks(list);
      if (list[0]?.token) setBankToken(list[0].token);
      setShowAddBank(list.length === 0);
      setHistory(loadStore(uid));
      setScreen("shop");
    } catch (e) {
      setError(
        friendlyError(e instanceof Error ? e.message : "Sign-in failed")
      );
    } finally {
      setBusy(false);
    }
  }

  function openTerms(from: Screen) {
    setTermsReturn(from);
    setScreen("terms");
  }

  function startCheckout(next: CatalogItem) {
    setItem(next);
    setConsented(false);
    setError(null);
    setTotalsLabel(null);
    setScreen("checkout");
    void previewTotals(next);
  }

  async function previewTotals(next: CatalogItem) {
    if (!sessionKey) return;
    try {
      const jwtRes = await postCheckoutJwtToken({
        subtotalCents: next.amountCents,
        email,
      });
      const jwt = extractJwtToken(jwtRes.data);
      if (!jwtRes.ok || !jwt) return;
      const totals = await postCheckoutTotals({
        sessionKey,
        subtotalCents: next.amountCents,
        jwtToken: jwt,
      });
      if (!totals.ok) return;
      const card = (totals.data as { card?: { total?: { cents?: number } } })
        .card;
      const ach = (totals.data as { ach?: { total?: { cents?: number } } }).ach;
      const totalCents = ach?.total?.cents ?? card?.total?.cents ?? next.amountCents;
      setTotalsLabel(`Estimated total: ${dollars(totalCents)}`);
    } catch {}
  }

  async function refreshBanks() {
    if (!sessionKey) return;
    const list = await fetchCustomerBanks(sessionKey);
    setBanks(list);
    if (list[0]?.token && !bankToken) setBankToken(list[0].token);
    setShowAddBank(list.length === 0);
  }

  async function addBank() {
    if (
      !routingNumber.trim() ||
      !accountNumber.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !address1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !zip.trim()
    ) {
      setError("Enter name, address, routing, and account numbers");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await postCustomerBankAccount({
        userId,
        email,
        routingNumber,
        accountNumber,
        alias: bankAlias,
        firstName,
        lastName,
        address1,
        city,
        state,
        zip,
      });
      if (!result.ok) {
        setError(friendlyError(formatApiError(result)));
        return;
      }
      const token = extractBankToken(result.data);
      await refreshBanks();
      if (token) {
        setBankToken(token);
        setShowAddBank(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add bank account");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCheckout() {
    if (!item || !sessionKey || !consented || !bankToken.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const jwtRes = await postCheckoutJwtToken({
        subtotalCents: item.amountCents,
        email,
      });
      const jwt = extractJwtToken(jwtRes.data);
      if (!jwtRes.ok || !jwt) {
        setError("We couldn't start checkout. Please try again.");
        return;
      }

      await postCheckoutTotals({
        sessionKey,
        subtotalCents: item.amountCents,
        jwtToken: jwt,
      });

      const consentTimestamp = new Date().toISOString();
      const structuredTerms = buildStructuredTerms(item);

      const authBody = {
        renderedAuthorizationText: disclosure,
        consentTimestamp,
        sessionAuthRef: sessionAuthRef || `sess_${uuid().slice(0, 10)}`,
        idempotencyKey: uuid(),
        token: bankToken.trim(),
        orderType: item.orderType,
        structuredTerms,
      };

      const authRes = await createAchAuthorization({
        sessionKey,
        body: authBody,
      });
      if (!authRes.ok || !authRes.data._id) {
        setError(
          friendlyError(formatApiError(authRes) || "Authorization failed")
        );
        return;
      }

      const checkoutRes = await postAchCheckout({
        sessionKey,
        subtotalCents: item.amountCents,
        token: bankToken.trim(),
        jwtToken: jwt,
        achAuthorizationId: authRes.data._id,
        orderType: item.orderType,
      });
      if (!checkoutRes.ok) {
        setError(
          friendlyError(formatApiError(checkoutRes) || "Payment failed")
        );
        return;
      }

      const paymentId = extractPaymentId(checkoutRes.data);
      if (item.orderType === "one_time_purchase") {
        void putAchAuthorizationStatus({
          authorizationId: authRes.data._id,
          eventType: "fully_filled",
        });
      }

      const bank = banks.find((b) => b.token === bankToken);
      const stored: StoredAuth = {
        authorization: authRes.data,
        item,
        paymentId,
        amountCents: item.amountCents,
        bankLast4: bank?.last4 || authRes.data.accountLastFour,
        consentedAt: consentTimestamp,
        receiptText: disclosure,
      };
      const nextHistory = [stored, ...loadStore(userId.trim())];
      saveStore(userId.trim(), nextHistory);
      setHistory(nextHistory);
      setReceipt(stored);
      setScreen("receipt");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancelAuthorization(entry: StoredAuth) {
    setBusy(true);
    setError(null);
    try {
      await putAchAuthorizationStatus({
        authorizationId: entry.authorization._id,
        eventType: "archived",
      });
      const revokeRes = await revokeAchAuthorization(entry.authorization._id);
      if (!revokeRes.ok) {
        setError(formatApiError(revokeRes));
        return;
      }
      const next = history.map((h) =>
        h.authorization._id === entry.authorization._id
          ? {
              ...h,
              authorization: { ...h.authorization, revoked: true },
            }
          : h
      );
      saveStore(userId.trim(), next);
      setHistory(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    setSessionKey("");
    setSessionAuthRef("");
    setItem(null);
    setReceipt(null);
    setConsented(false);
    setEsignAccepted(false);
    setScreen("signin");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => sessionKey && setScreen("shop")}>
          {MERCHANT_NAME}
        </button>
        {sessionKey ? (
          <nav className="nav">
            <button type="button" onClick={() => setScreen("shop")}>
              Shop
            </button>
            <button type="button" onClick={() => setScreen("account")}>
              Account
            </button>
            <button type="button" onClick={() => openTerms("shop")}>
              Terms
            </button>
            <button type="button" className="ghost" onClick={signOut}>
              Sign out
            </button>
          </nav>
        ) : null}
      </header>

      <main className="main">
        {!HAS_API_KEY && (
          <p className="banner err">
            We&apos;re having trouble connecting right now. Please try again
            later.
          </p>
        )}
        {error && <p className="banner err">{error}</p>}

        {screen === "signin" && (
          <section className="card signin">
            <p className="eyebrow">Welcome back</p>
            <h1>Sign in to {MERCHANT_NAME}</h1>
            <p className="lede">
              Sign in to shop, subscribe, and manage your payments.
            </p>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@email.com"
              />
            </label>
            <label className="consent">
              <input
                type="checkbox"
                checked={esignAccepted}
                onChange={(e) => setEsignAccepted(e.target.checked)}
              />
              <span>
                I agree to {MERCHANT_NAME}&apos;s{" "}
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => openTerms("signin")}
                >
                  Terms &amp; Conditions
                </button>
                , including the Electronic Record and Signature Disclosure
                (E-SIGN Consent).
              </span>
            </label>
            <button
              type="button"
              className="primary"
              disabled={busy || !esignAccepted}
              onClick={() => void signIn()}
            >
              {busy ? "Signing in…" : "Continue"}
            </button>
          </section>
        )}

        {screen === "shop" && (
          <section>
            <div className="hero">
              <h1>What are you shopping for?</h1>
              <p>
                One-time buys, subscriptions, auto top-ups, and credit orders —
                paid securely from your bank.
              </p>
            </div>
            <div className="catalog">
              {CATALOG.map((product) => (
                <article key={product.id} className="product">
                  <div>
                    <p className="tag">{orderTypeLabel(product.orderType)}</p>
                    <h2>{product.title}</h2>
                    <p>{product.description}</p>
                  </div>
                  <div className="product-foot">
                    <strong>{catalogPriceLabel(product)}</strong>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => startCheckout(product)}
                    >
                      {catalogCtaLabel(product)}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {screen === "checkout" && item && (
          <section className="checkout">
            <button
              type="button"
              className="back"
              onClick={() => {
                setConsented(false);
                setItem(null);
                setScreen("shop");
              }}
            >
              ← Back to shop
            </button>
            <h1>Checkout</h1>

            <div className="split">
              <div className="stack">
                <div className="card">
                  <h2>Order</h2>
                  <div className="row">
                    <span>{item.title}</span>
                    <strong>{catalogPriceLabel(item)}</strong>
                  </div>
                  {totalsLabel ? <p className="fine">{totalsLabel}</p> : null}
                </div>

                <div className="card">
                  <h2>Bank account</h2>
                  {banks.length > 0 && !showAddBank ? (
                    <>
                      <label>
                        Pay from
                        <select
                          value={bankToken}
                          onChange={(e) => setBankToken(e.target.value)}
                        >
                          {banks.map((b) => (
                            <option key={b.token} value={b.token}>
                              {b.alias || "Bank"}
                              {b.last4 ? ` ····${b.last4}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => setShowAddBank(true)}
                      >
                        Use a different bank
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="fine">
                        Link a U.S. bank account to pay by ACH debit.
                      </p>
                      <div className="grid-two">
                        <label>
                          First name
                          <input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="given-name"
                          />
                        </label>
                        <label>
                          Last name
                          <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            autoComplete="family-name"
                          />
                        </label>
                      </div>
                      <label>
                        Street address
                        <input
                          value={address1}
                          onChange={(e) => setAddress1(e.target.value)}
                          autoComplete="street-address"
                        />
                      </label>
                      <div className="grid-two">
                        <label>
                          City
                          <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            autoComplete="address-level2"
                          />
                        </label>
                        <label>
                          State
                          <input
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            autoComplete="address-level1"
                            maxLength={2}
                            placeholder="CA"
                          />
                        </label>
                      </div>
                      <label>
                        ZIP
                        <input
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          autoComplete="postal-code"
                        />
                      </label>
                      <label>
                        Account nickname
                        <input
                          value={bankAlias}
                          onChange={(e) => setBankAlias(e.target.value)}
                          placeholder="Checking"
                        />
                      </label>
                      <label>
                        Routing number
                        <input
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                          inputMode="numeric"
                          placeholder="9 digits"
                        />
                      </label>
                      <label>
                        Account number
                        <input
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          inputMode="numeric"
                        />
                      </label>
                      <button
                        type="button"
                        className="secondary"
                        disabled={busy}
                        onClick={() => void addBank()}
                      >
                        {busy ? "Saving…" : "Save bank account"}
                      </button>
                      {banks.length > 0 ? (
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => setShowAddBank(false)}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </>
                  )}
                </div>

                <div className="card">
                  <h2>Authorize ACH debit</h2>
                  <div className="disclosure">{disclosure}</div>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={consented}
                      onChange={(e) => setConsented(e.target.checked)}
                    />
                    <span>
                      By checking this box, I authorize the debit
                      {item.orderType === "one_time_purchase" ? "" : "(s)"}{" "}
                      described above and agree to {MERCHANT_NAME}&apos;s{" "}
                      <button
                        type="button"
                        className="inline-link"
                        onClick={() => openTerms("checkout")}
                      >
                        Terms &amp; Conditions
                      </button>
                      , which include important disclosures about electronic
                      signatures and communications (E-SIGN Consent).
                    </span>
                  </label>
                  <p className="fine">
                    You can cancel anytime before Confirm. Clicking back leaves
                    this page without charging.
                  </p>
                  <button
                    type="button"
                    className="primary"
                    disabled={busy || !consented || !bankToken.trim()}
                    onClick={() => void confirmCheckout()}
                  >
                    {busy ? "Processing…" : confirmCtaLabel(item)}
                  </button>
                </div>
              </div>

              <aside className="card summary">
                <h2>Summary</h2>
                <div className="row">
                  <span>Subtotal</span>
                  <span>{dollars(item.amountCents)}</span>
                </div>
                <div className="row">
                  <span>Payment</span>
                  <span>ACH debit</span>
                </div>
                <div className="row total">
                  <span>Due today</span>
                  <strong>{dollars(item.amountCents)}</strong>
                </div>
              </aside>
            </div>
          </section>
        )}

        {screen === "receipt" && receipt && (
          <section className="card receipt">
            <p className="eyebrow ok">You&apos;re all set</p>
            <h1>{receiptTitle(receipt.item)}</h1>
            <p className="lede">
              A confirmation was sent to <strong>{email}</strong> with the exact
              authorization you agreed to.
            </p>
            <dl className="kv">
              <div>
                <dt>Item</dt>
                <dd>{receipt.item.title}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{orderTypeLabel(receipt.item.orderType)}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{catalogPriceLabel(receipt.item)}</dd>
              </div>
              {receipt.paymentId ? (
                <div>
                  <dt>Confirmation</dt>
                  <dd>{receipt.paymentId}</dd>
                </div>
              ) : null}
              {receipt.bankLast4 ? (
                <div>
                  <dt>Bank</dt>
                  <dd>····{receipt.bankLast4}</dd>
                </div>
              ) : null}
            </dl>
            <details>
              <summary>Authorization copy</summary>
              <pre>{receipt.receiptText}</pre>
            </details>
            <div className="actions">
              <button
                type="button"
                className="primary"
                onClick={() => setScreen("shop")}
              >
                Continue shopping
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setScreen("account")}
              >
                Manage in account
              </button>
            </div>
          </section>
        )}

        {screen === "terms" && (
          <section className="card terms">
            <button
              type="button"
              className="back"
              onClick={() => setScreen(termsReturn)}
            >
              ← Back
            </button>
            <p className="eyebrow">Legal</p>
            <h1>Terms &amp; Conditions</h1>
            <p className="lede">
              Read and keep a copy of these Terms for your records.
            </p>
            <pre className="legal-text">{buildTermsAndConditions()}</pre>
            {termsReturn === "signin" ? (
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setEsignAccepted(true);
                  setScreen("signin");
                }}
              >
                I have read this — return to sign in
              </button>
            ) : (
              <button
                type="button"
                className="secondary"
                onClick={() => setScreen(termsReturn)}
              >
                Close
              </button>
            )}
          </section>
        )}

        {screen === "account" && (
          <section>
            <div className="hero">
              <h1>Account</h1>
              <p>
                Signed in as <strong>{email}</strong>
              </p>
            </div>
            <div className="card">
              <h2>Purchases &amp; authorizations</h2>
              <p className="fine">
                Cancel an authorization anytime in this account. For help,
                contact {MERCHANT_SUPPORT}.
              </p>
              {history.length === 0 ? (
                <p className="empty">No purchases or authorizations yet.</p>
              ) : (
                <ul className="auth-list">
                  {history.map((entry) => (
                    <li key={entry.authorization._id}>
                      <div>
                        <strong>{entry.item.title}</strong>
                        <p>
                          {catalogPriceLabel(entry.item)} ·{" "}
                          {orderTypeLabel(entry.item.orderType)}
                          {entry.authorization.revoked ? " · canceled" : ""}
                        </p>
                      </div>
                      {!entry.authorization.revoked ? (
                        <button
                          type="button"
                          className="danger"
                          disabled={busy}
                          onClick={() => void cancelAuthorization(entry)}
                        >
                          {cancelLabel(entry.item)}
                        </button>
                      ) : (
                        <span className="pill">Canceled</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
