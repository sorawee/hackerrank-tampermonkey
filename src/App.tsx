import Leaderboard from './Leaderboard';
import Submission from './Submission';

function App() {
  return window.location.pathname.includes("/leaderboard")
    ? <Leaderboard />
    : <Submission />;
}

export default App;
