import { Link, Route, Switch } from 'wouter';
import './App.css';
import setting from '@/assets/setting.svg';
import Code from './components/Code';
import Setting from './pages/Setting';

function App() {
  return (
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
  );
}

export default App;
