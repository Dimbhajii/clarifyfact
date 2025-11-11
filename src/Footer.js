import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="cf-footer">
      <div className="cf-footer__inner">
        <div className="cf-footer__brand">
          <div className="cf-footer__logo">ClarifyFact</div>
          <p className="cf-footer__tagline">Humanize AI text and outsmart detectors.</p>
        </div>
        <div className="cf-footer__links">
          <div className="cf-footer__column">
            <h4 className="cf-footer__heading">Product</h4>
            <ul className="cf-footer__list">
              <li><a href="#humanizer" className="cf-footer__link">Humanizer</a></li>
              <li><Link to="/pricing" className="cf-footer__link">Pricing</Link></li>
            </ul>
          </div>
          <div className="cf-footer__column">
            <h4 className="cf-footer__heading">Resources</h4>
            <ul className="cf-footer__list">
              <li><Link to="/ethical-usage" className="cf-footer__link">Ethical Usage</Link></li>
            </ul>
          </div>
          <div className="cf-footer__column">
            <h4 className="cf-footer__heading">Contact</h4>
            <ul className="cf-footer__list">
              <li>
                <a href="mailto:hello.clarifyfact@gmail.com" className="cf-footer__link">hello.clarifyfact@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="cf-footer__bottom">
        <p className="cf-footer__copyright">
          © {new Date().getFullYear()} ClarifyFact. All rights reserved. 
          <span className="cf-footer__separator"> | </span>
          <Link to="/terms-of-service" className="cf-footer__bottom-link">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
