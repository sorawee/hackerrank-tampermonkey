import Leaderboard from './Leaderboard';
import Submission from './Submission';

function App({ input }: { input: object }) {
  return window.location.pathname.includes("/leaderboard")
    ? <Leaderboard input={input} />
    : <Submission input={input} />;
}

export default App;
