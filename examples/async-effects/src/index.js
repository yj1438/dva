import React from 'react';
import ReactDOM from 'react-dom';
import { Routes, Route, Link, Outlet } from 'react-router-dom';
import dva from 'dva/index';
import { Detail } from './components/detail';
import { Home } from './components/home';
import data from './models/data';

const dvaInstance = dva();
dvaInstance.model(data);
dvaInstance.router(Router);
const DvaRoot = dvaInstance.start();

function App() {
  return (
    <div>
      <Home />
      <Detail />
    </div>
  );
}

function Layout() {
  return (
    <div>
      <nav>
        <div>
          <Link to="/">Index</Link>
        </div>
        <div>
          <Link to="/home">Home</Link>
        </div>
        <div>
          <Link to="/detail">Detail</Link>
        </div>
      </nav>
      <br />
      <Outlet />
    </div>
  );
}

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<App />} />
        <Route path="/home" element={<Home />} />
        <Route path="/detail" element={<Detail />} />
      </Route>
    </Routes>
  );
}

ReactDOM.render(<DvaRoot />, document.getElementById('app'));
