import { Router, Link, Route, Switch } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import './App.css';
import setting from '@/assets/setting.svg';
import back from '@/assets/return.svg';
import Code from './components/Code';
import Setting from './pages/Setting';

function App() {
  const [location] = useHashLocation();
  const isSetting = location === '/setting';

  return (
    <Router hook={useHashLocation}>
      <div className="container">
        <h1 className="title">
          Authenticator
          {isSetting ? (
            <Link href="/" style={{ display: 'inline-flex' }}>
              <img src={back} className="setting" alt="back" />
            </Link>
          ) : (
            <Link href="/setting" style={{ display: 'inline-flex' }}>
              <img src={setting} className="setting" alt="setting" />
            </Link>
          )}
        </h1>
        <Switch>
          <Route path="/" component={Code} />
          <Route path="/setting" component={Setting} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
