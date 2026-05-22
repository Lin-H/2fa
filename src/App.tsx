import { Router, Link, Route, Switch } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import './App.css';
import setting from '@/assets/setting.svg';
import Code from './components/Code';
import Setting from './pages/Setting';

function App() {
  return (
    <Router hook={useHashLocation}>
      <div className="container">
        <h1 className="title">
          Authenticator
          <Link href="/setting" style={{ display: 'inline-flex' }}>
            <img src={setting} className="setting" alt="setting" />
          </Link>
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
