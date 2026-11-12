import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import type { TripPlan, TripRequest } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const interestOptions = ["Food", "Architecture", "Nature", "Museums", "Nightlife", "Local culture"];

function formatSchedule(value: string | null): string {
  if (!value) return "Time not listed";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function localDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function App() {
  const [origin, setOrigin] = useState("SFO");
  const [destination, setDestination] = useState("FCO");
  const [destinationName, setDestinationName] = useState("Rome, Italy");
  const [departureDate, setDepartureDate] = useState(localDate(30));
  const [returnDate, setReturnDate] = useState(localDate(37));
  const [travelers, setTravelers] = useState(2);
  const [budgetLevel, setBudgetLevel] = useState<TripRequest["budget_level"]>("balanced");
  const [interests, setInterests] = useState<string[]>(["Food", "Architecture"]);
  const [notes, setNotes] = useState("");
  const [conversationId, setConversationId] = useState<string>(() => localStorage.getItem("waypoint-conversation") ?? "");
  const [plan, setPlan] = useState<TripPlan>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dateLabel = useMemo(() => {
    if (!departureDate || !returnDate) return "Choose your dates";
    const start = new Date(`${departureDate}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
    const end = new Date(`${returnDate}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
    return `${start} — ${end}`;
  }, [departureDate, returnDate]);

  function toggleInterest(interest: string) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPlan(undefined);

    const request: TripRequest = {
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      destination_name: destinationName.trim(),
      departure_date: departureDate,
      return_date: returnDate,
      travelers,
      budget_level: budgetLevel,
      interests,
      notes: notes.trim(),
      conversation_id: conversationId || undefined,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = typeof data.detail === "string" ? data.detail : "The trip could not be planned. Check the server and try again.";
        throw new Error(detail);
      }
      setPlan(data as TripPlan);
      setConversationId(data.conversation_id as string);
      localStorage.setItem("waypoint-conversation", data.conversation_id as string);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Waypoint home">
          <span className="brand-mark">W</span>
          <span>waypoint<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-note"><span className="status-dot" /> A more thoughtful way to travel</div>
        <a className="topbar-link" href="#how-it-works">How it works <span aria-hidden="true">↗</span></a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL AI TRAVEL TEAM</p>
            <h1>Go somewhere<br /><em>worth remembering.</em></h1>
            <p className="hero-description">Four focused agents work together to find your way there, uncover places to stay, and shape a trip around you.</p>
            <div className="hero-facts">
              <span><b>01</b> Flights</span>
              <span><b>02</b> Stays</span>
              <span><b>03</b> Itinerary</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Abstract illustration of a sun over a mountain landscape" role="img">
            <div className="sun" />
            <div className="mountain mountain-back" />
            <div className="mountain mountain-front" />
            <div className="route route-one" />
            <div className="route route-two" />
            <div className="route-pin"><span>✦</span></div>
            <div className="art-caption"><span>YOUR NEXT CHAPTER</span><b>is closer than you think</b></div>
          </div>
        </section>

        <section className="planner-layout" aria-label="Trip planning form and results">
          <aside className="planner-card">
            <div className="card-heading">
              <div><p className="eyebrow">LET'S GET STARTED</p><h2>Plan your escape</h2></div>
              <span className="step-badge">01 / 01</span>
            </div>

            <form onSubmit={submitPlan}>
              <div className="route-fields">
                <label className="field">
                  <span>Flying from</span>
                  <div className="input-with-code"><input value={origin} onChange={(e) => setOrigin(e.target.value)} required maxLength={3} aria-label="Origin airport IATA code" /><small>IATA</small></div>
                </label>
                <div className="swap-icon" aria-hidden="true">↗</div>
                <label className="field">
                  <span>Going to</span>
                  <div className="input-with-code"><input value={destination} onChange={(e) => setDestination(e.target.value)} required maxLength={3} aria-label="Destination airport IATA code" /><small>IATA</small></div>
                </label>
              </div>
              <p className="field-hint">Use 3-letter airport codes, like DEL, SFO, or FCO.</p>

              <label className="field field-spaced">
                <span>Destination city</span>
                <input value={destinationName} onChange={(e) => setDestinationName(e.target.value)} placeholder="Rome, Italy" required />
              </label>

              <div className="date-fields field-spaced">
                <label className="field"><span>Depart</span><input type="date" value={departureDate} min={localDate(0)} onChange={(e) => setDepartureDate(e.target.value)} required /></label>
                <label className="field"><span>Return</span><input type="date" value={returnDate} min={departureDate} onChange={(e) => setReturnDate(e.target.value)} required /></label>
              </div>

              <div className="traveler-budget field-spaced">
                <label className="field"><span>Travelers</span><select value={travelers} onChange={(e) => setTravelers(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} {count === 1 ? "traveler" : "travelers"}</option>)}</select></label>
                <label className="field"><span>Travel style</span><select value={budgetLevel} onChange={(e) => setBudgetLevel(e.target.value as TripRequest["budget_level"])}><option value="budget">Thoughtful budget</option><option value="balanced">A little of both</option><option value="premium">A special treat</option></select></label>
              </div>

              <fieldset className="interest-fieldset field-spaced">
                <legend>What do you love?</legend>
                <div className="interest-list">{interestOptions.map((interest) => <button className={`interest-chip ${interests.includes(interest) ? "selected" : ""}`} type="button" key={interest} onClick={() => toggleInterest(interest)} aria-pressed={interests.includes(interest)}>{interest}</button>)}</div>
              </fieldset>

              <label className="field field-spaced">
                <span>Anything else? <small>Optional</small></span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="A slow morning, a little less walking, somewhere good for dinner…" rows={3} maxLength={1200} />
              </label>

              {error && <div className="error-box" role="alert"><span>!</span><p>{error}</p></div>}
              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Your agents are planning</> : <>Build my itinerary <span aria-hidden="true">→</span></>}
              </button>
              <p className="privacy-note"><span aria-hidden="true">✳</span> Your preferences stay in your trip thread.</p>
            </form>
          </aside>

          <section className={`results-panel ${plan ? "has-plan" : ""}`} aria-live="polite">
            {!plan && !loading && (
              <div className="empty-state">
                <div className="orbit-art"><span className="orbit-core">✦</span><i className="orbit-dot dot-a" /><i className="orbit-dot dot-b" /><i className="orbit-dot dot-c" /></div>
                <p className="eyebrow">MADE AROUND YOU</p>
                <h2>Your trip, thoughtfully<br />put together.</h2>
                <p>Share a few details and your travel team will bring the pieces together: flight information, stay ideas, and a day-by-day plan.</p>
                <div className="agent-mini-list"><span>✈ <b>Flight Agent</b></span><span>⌂ <b>Stay Agent</b></span><span>⌖ <b>Itinerary Agent</b></span></div>
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <div className="loading-orbit"><span>✦</span></div>
                <p className="eyebrow">A LITTLE JOURNEY IS COMING TOGETHER</p>
                <h2>Your agents are comparing notes.</h2>
                <p>Searching travel details and shaping your itinerary for {destinationName || "your destination"}.</p>
                <div className="agent-progress"><span>Flight Agent</span><i /><span>Stay Agent</span><i /><span>Itinerary Agent</span><i /><span>Final Response</span></div>
              </div>
            )}

            {plan && (
              <div className="plan-results">
                <div className="plan-intro">
                  <div><p className="eyebrow">A FIRST DRAFT FOR YOUR TRIP</p><h2>{destinationName}</h2><p>{origin.toUpperCase()} to {destination.toUpperCase()} <span className="bullet-separator">·</span> {dateLabel} <span className="bullet-separator">·</span> {travelers} {travelers === 1 ? "traveler" : "travelers"}</p></div>
                  <span className="trip-sparkle">✦</span>
                </div>

                <div className="agent-strip">{plan.agents.map((agent, index) => <span key={agent}><i>{String(index + 1).padStart(2, "0")}</i>{agent}</span>)}</div>

                <article className="result-card final-card"><div className="result-title"><span className="result-icon">✦</span><div><p className="eyebrow">THE BIG PICTURE</p><h3>Your travel brief</h3></div></div><div className="markdown-body"><ReactMarkdown>{plan.final_response}</ReactMarkdown></div></article>

                <article className="result-card"><div className="result-title"><span className="result-icon">✈</span><div><p className="eyebrow">GETTING THERE</p><h3>Flight ideas</h3></div></div><div className="markdown-body"><ReactMarkdown>{plan.flight_summary}</ReactMarkdown></div>
                  {plan.flights.length > 0 && <div className="flight-list">{plan.flights.map((flight, index) => <div className="flight-row" key={`${flight.flight_number}-${index}`}><div className="flight-number">{flight.flight_number}</div><div><b>{flight.airline}</b><small>{flight.departure_airport || origin} → {flight.arrival_airport || destination}</small></div><div className="flight-times"><b>{formatSchedule(flight.departure_time)}</b><small>{flight.status || "Schedule information"}{flight.arrival_time ? ` · arrives ${formatSchedule(flight.arrival_time)}` : ""}</small></div></div>)}</div>}
                </article>

                <article className="result-card"><div className="result-title"><span className="result-icon">⌂</span><div><p className="eyebrow">A PLACE TO LAND</p><h3>Stay ideas</h3></div></div><div className="markdown-body"><ReactMarkdown>{plan.hotel_summary}</ReactMarkdown></div>
                  {plan.hotels.length > 0 && <div className="hotel-list">{plan.hotels.map((hotel) => <a href={hotel.url} target="_blank" rel="noreferrer" className="hotel-link" key={hotel.url}><span><b>{hotel.title}</b><small>{hotel.snippet}</small></span><i aria-hidden="true">↗</i></a>)}</div>}
                </article>

                <article className="result-card itinerary-card"><div className="result-title"><span className="result-icon">⌖</span><div><p className="eyebrow">DAY BY DAY</p><h3>A plan with room to wander</h3></div></div><div className="markdown-body"><ReactMarkdown>{plan.itinerary}</ReactMarkdown></div></article>
                <p className="disclaimer">Flight and lodging results are informational search leads, not confirmed availability or reservations. Verify details with providers before booking.</p>
              </div>
            )}
          </section>
        </section>

        <section className="how-it-works" id="how-it-works">
          <div className="how-heading"><p className="eyebrow">FOUR MINDS, ONE GOOD TRIP</p><h2>Every detail has a<br /><em>thoughtful first pass.</em></h2></div>
          <div className="agent-grid">
            <article><span className="agent-number">01</span><div className="agent-symbol">✈</div><h3>Flight Agent</h3><p>Looks up route and schedule information to help you get oriented.</p></article>
            <article><span className="agent-number">02</span><div className="agent-symbol">⌂</div><h3>Hotel Agent</h3><p>Searches the web for lodging leads matched to your trip and travel style.</p></article>
            <article><span className="agent-number">03</span><div className="agent-symbol">⌖</div><h3>Itinerary Agent</h3><p>Turns your dates and interests into a practical day-by-day outline.</p></article>
            <article><span className="agent-number">04</span><div className="agent-symbol">✦</div><h3>Final Response Agent</h3><p>Brings the research together into one clear trip brief.</p></article>
          </div>
        </section>
      </main>

      <footer className="footer"><a className="brand" href="#top"><span className="brand-mark">W</span><span>waypoint<span className="brand-period">.</span></span></a><p>Made for the places you'll remember.</p><span className="footer-label">AI-POWERED TRIP PLANNING</span></footer>
    </div>
  );
}

export default App;
