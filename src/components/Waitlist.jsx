function Waitlist({ waitlist }) {
  if (!waitlist || waitlist.length === 0) {
    return null;
  }

  return (
    <div className="waitlist">
      <p className="waitlist-info">
        These players will be added to teams as slots open up:
      </p>
      <ol className="waitlist-list">
        {waitlist.map((person, index) => (
          <li key={person.id} className="waitlist-item">
            <span className="position">{index + 1}.</span>
            <span className="name">{person.nickname}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default Waitlist;
