import { useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ButtonLink } from './Button';

const projectTypes = [
  'Business Website',
  'Landing Page',
  'E-commerce',
  'Restaurant Website',
  'Portfolio',
  'SaaS Website',
  'Website Redesign',
  'AI Integration',
  'Automation',
  'Other',
];

const initialForm = {
  name: '',
  email: '',
  company: '',
  projectType: '',
  projectDetails: '',
  currentWebsite: '',
  faxNumber: '',
};

function createSubmissionId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeWebsite(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidWebsite(value) {
  if (!value.trim()) return true;
  try {
    const url = new URL(normalizeWebsite(value));
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
}

function validate(values) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const company = values.company.trim();
  const details = values.projectDetails.trim();

  if (name.length < 2 || name.length > 100) errors.name = 'Please enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) errors.email = 'Please enter a valid email address.';
  if (company.length < 2 || company.length > 160) errors.company = 'Please enter your business or company name.';
  if (!projectTypes.includes(values.projectType)) errors.projectType = 'Please choose a project type.';
  if (details.length < 20) errors.projectDetails = 'Tell us a little more—at least 20 characters.';
  if (details.length > 5000) errors.projectDetails = 'Project details must be 5,000 characters or fewer.';
  if (!isValidWebsite(values.currentWebsite)) errors.currentWebsite = 'Enter a valid website address, such as example.com.';
  return errors;
}

export function ClientCTA() {
  return (
    <section className="client-cta" aria-labelledby="client-cta-title">
      <div className="client-cta-inner shell reveal">
        <p className="eyebrow">The next move</p>
        <div>
          <h2 id="client-cta-title">Have a business<br />worth showing off?</h2>
          <p>Let&apos;s build a website that does it justice.</p>
        </div>
        <div className="client-cta-actions">
          <ButtonLink href="/contact" variant="dark">Start a Project</ButtonLink>
          <ButtonLink href="/demos" variant="dark-text">View Our Demos</ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [serverMessage, setServerMessage] = useState('');
  const submissionIdRef = useRef(createSubmissionId());

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'submitting') return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    setServerMessage('');

    if (Object.keys(nextErrors).length > 0) {
      setStatus('error');
      event.currentTarget.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }

    setStatus('submitting');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT || '/api/contact';
      const payload = {
        submissionId: submissionIdRef.current,
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        projectType: form.projectType,
        projectDetails: form.projectDetails.trim(),
        currentWebsite: normalizeWebsite(form.currentWebsite),
        faxNumber: form.faxNumber,
      };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      // Vite serves an unknown /api path as the app during local development. Do not
      // show a false success state unless the configured boundary explicitly confirms it.
      if (!response.ok || data.ok !== true) throw new Error(data.message || 'submission_failed');
      setStatus('success');
      setErrors({});
      setForm(initialForm);
      submissionIdRef.current = createSubmissionId();
    } catch {
      setStatus('error');
      setServerMessage('We couldn’t send your request right now. Please try again in a moment.');
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const fieldClass = (name) => `form-field ${errors[name] ? 'form-field--error' : ''}`;

  return (
    <section className="contact section section--dark" aria-labelledby="contact-title">
      <div className="contact-layout shell">
        <div className="contact-intro reveal">
          <p className="eyebrow">Start a project</p>
          <h1 id="contact-title">Tell us what you&apos;re building.</h1>
          <p>Share the essentials. We&apos;ll review your project and come back with the clearest next step.</p>
          <div className="contact-expectation">
            <span>What happens next</span>
            <ol>
              <li><i>01</i>We review your project</li>
              <li><i>02</i>We clarify fit and scope</li>
              <li><i>03</i>We schedule a free consultation</li>
            </ol>
          </div>
        </div>

        <div className="contact-form-wrap reveal">
          {status === 'success' ? (
            <div className="form-success" role="status">
              <CheckCircle2 aria-hidden="true" />
              <p className="eyebrow">Request received</p>
              <h2>Project request received. We&apos;ll get back to you soon.</h2>
              <p>Your details have been sent securely to Katch.</p>
              <button type="button" onClick={() => {
                setStatus('idle');
                setErrors({});
                setServerMessage('');
              }}>
                Send another request <ArrowDownRight aria-hidden="true" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className={fieldClass('name')}>
                  <label htmlFor="name">Name <span aria-hidden="true">*</span></label>
                  <input id="name" name="name" value={form.name} onChange={update} autoComplete="name" maxLength="100" placeholder="Your name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} required />
                  {errors.name && <small id="name-error">{errors.name}</small>}
                </div>
                <div className={fieldClass('email')}>
                  <label htmlFor="email">Email <span aria-hidden="true">*</span></label>
                  <input id="email" name="email" type="email" value={form.email} onChange={update} autoComplete="email" inputMode="email" maxLength="254" placeholder="you@company.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} required />
                  {errors.email && <small id="email-error">{errors.email}</small>}
                </div>
                <div className={fieldClass('company')}>
                  <label htmlFor="company">Business / Company <span aria-hidden="true">*</span></label>
                  <input id="company" name="company" value={form.company} onChange={update} autoComplete="organization" maxLength="160" placeholder="Company name" aria-invalid={Boolean(errors.company)} aria-describedby={errors.company ? 'company-error' : undefined} required />
                  {errors.company && <small id="company-error">{errors.company}</small>}
                </div>
                <div className={fieldClass('projectType')}>
                  <label htmlFor="projectType">Project Type <span aria-hidden="true">*</span></label>
                  <div className="select-wrap">
                    <select id="projectType" name="projectType" value={form.projectType} onChange={update} aria-invalid={Boolean(errors.projectType)} aria-describedby={errors.projectType ? 'project-type-error' : undefined} required>
                      <option value="">Select a project</option>
                      {projectTypes.map((projectType) => <option key={projectType}>{projectType}</option>)}
                    </select>
                    <ArrowDownRight aria-hidden="true" />
                  </div>
                  {errors.projectType && <small id="project-type-error" role="alert">{errors.projectType}</small>}
                </div>
                <div className={`${fieldClass('currentWebsite')} form-field--full`}>
                  <label htmlFor="currentWebsite">Current Website <span className="field-optional">Optional</span></label>
                  <input id="currentWebsite" name="currentWebsite" type="url" inputMode="url" value={form.currentWebsite} onChange={update} autoComplete="url" maxLength="500" placeholder="https://example.com" aria-invalid={Boolean(errors.currentWebsite)} aria-describedby={errors.currentWebsite ? 'current-website-error' : 'current-website-hint'} />
                  <small id={errors.currentWebsite ? 'current-website-error' : 'current-website-hint'}>{errors.currentWebsite || 'Share your existing website if you have one.'}</small>
                </div>
                <div className={`${fieldClass('projectDetails')} form-field--full`}>
                  <label htmlFor="projectDetails">Project Details <span aria-hidden="true">*</span></label>
                  <textarea id="projectDetails" name="projectDetails" value={form.projectDetails} onChange={update} rows="5" maxLength="5000" placeholder="What do you need, what is not working today, and when would you like to launch?" aria-invalid={Boolean(errors.projectDetails)} aria-describedby={errors.projectDetails ? 'project-details-error' : 'project-details-hint'} required />
                  <small id={errors.projectDetails ? 'project-details-error' : 'project-details-hint'}>{errors.projectDetails || 'A few useful details are enough to start.'}</small>
                </div>
                <div className="form-honeypot" aria-hidden="true">
                  <label htmlFor="faxNumber">Fax number</label>
                  <input id="faxNumber" name="faxNumber" value={form.faxNumber} onChange={update} tabIndex="-1" autoComplete="off" />
                </div>
              </div>

              <div className="form-submit-row">
                <button className="submit-button" type="submit" disabled={status === 'submitting'}>
                  <span>{status === 'submitting' ? 'Sending…' : 'Send Project Request'}</span>
                  <ArrowUpRight aria-hidden="true" />
                </button>
                <p>By submitting, you agree to be contacted about your project. No mailing list.</p>
              </div>
              <div className="form-status" aria-live="polite">
                {serverMessage && <p className="form-server-error">{serverMessage}</p>}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
