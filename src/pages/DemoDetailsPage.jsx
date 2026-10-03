import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ClientCTA } from '../components/Contact';
import { PageFrame } from '../components/PageFrame';
import { PageMeta } from '../components/PageMeta';
import { projects } from '../data/projects';
import NotFoundPage from './NotFoundPage';

export default function DemoDetailsPage() {
  const { projectId } = useParams();
  const projectIndex = projects.findIndex((item) => item.id === projectId);
  const project = projects[projectIndex];

  if (!project) return <NotFoundPage />;

  const nextProject = projects[(projectIndex + 1) % projects.length];
  const path = `/demos/${project.id}`;

  return (
    <PageFrame className="case-page">
      <PageMeta
        title={`${project.name} Demo Details — Katch`}
        description={project.description}
        path={path}
        image={`https://katch.agency${project.image}`}
        imageAlt={project.imageAlt}
        type="article"
      />

      <header className="case-page-hero">
        <div className="shell">
          <div className="case-page-intro">
            <div>
              <p className="eyebrow">{project.number} / {project.category}</p>
              <h1>{project.name}</h1>
            </div>
            <div className="case-overview">
              <p>{project.description}</p>
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                View Live Website <ExternalLink aria-hidden="true" size={16} />
              </a>
            </div>
          </div>

          <figure className="case-hero-image">
            <img
              src={project.image}
              srcSet={`${project.imageXSmall} 480w, ${project.imageSmall} 760w, ${project.image} 1440w`}
              sizes="(max-width: 820px) 94vw, 92vw"
              alt={project.imageAlt}
              width="1440"
              height="960"
              fetchPriority="high"
            />
            <figcaption>Live website homepage / Desktop view</figcaption>
          </figure>
        </div>
      </header>

      <main className="case-content">
        <div className="case-facts reveal">
          <div><span>Demo category</span><strong>{project.industry}</strong></div>
          <div><span>Scope</span><strong>Strategy, UI/UX, Development</strong></div>
          <div><span>Core capabilities</span><strong>{project.capabilities.join(', ')}</strong></div>
        </div>

        <section className="case-two-col reveal" aria-labelledby={`overview-${project.id}`}>
          <p className="case-section-label">01 / Demo overview</p>
          <div>
            <h2 id={`overview-${project.id}`}>A clear position from the first screen.</h2>
            <p>{project.positioning}</p>
          </div>
        </section>

        <section className="case-two-col reveal" aria-labelledby={`challenge-${project.id}`}>
          <p className="case-section-label">02 / The challenge</p>
          <div>
            <h2 id={`challenge-${project.id}`}>Make the first click count.</h2>
            <p>{project.challenge}</p>
          </div>
        </section>

        <section className="case-two-col reveal" aria-labelledby={`approach-${project.id}`}>
          <p className="case-section-label">03 / The approach</p>
          <div>
            <h2 id={`approach-${project.id}`}>Clarity before decoration.</h2>
            <p>{project.approach}</p>
          </div>
        </section>

        <section className="case-design-grid reveal" aria-labelledby={`design-${project.id}`}>
          <div>
            <p className="case-section-label">04 / Design and UX</p>
            <h2 id={`design-${project.id}`}>A visual system with a job to do.</h2>
            <p>{project.designDirection}</p>
          </div>
          <div className="case-feature-panel">
            <p>Key features</p>
            <ul>
              {project.features.map((feature, index) => (
                <li key={feature}><span>0{index + 1}</span>{feature}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="case-notes reveal" aria-label="Responsive experience and technical implementation">
          <article>
            <span>Responsive experience</span>
            <h2>Purpose-built for smaller screens.</h2>
            <p>{project.responsive}</p>
          </article>
          <article>
            <span>Technical implementation</span>
            <h2>Visual quality without unnecessary weight.</h2>
            <p>{project.technical}</p>
          </article>
        </section>

        <section className="case-two-col reveal" aria-labelledby={`performance-${project.id}`}>
          <p className="case-section-label">05 / Performance focus</p>
          <div>
            <h2 id={`performance-${project.id}`}>Speed is part of the experience.</h2>
            <p>{project.performance}</p>
          </div>
        </section>

        <section className="case-result reveal">
          <p className="case-section-label">06 / Final result</p>
          <h2>{project.result}</h2>
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            View Live Website <ArrowUpRight aria-hidden="true" />
          </a>
        </section>

        <div className="case-next reveal">
          <div>
            <p>Next project</p>
            <strong>{nextProject.name}</strong>
          </div>
          <Link to={`/demos/${nextProject.id}`}>
            View Demo Details <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </main>

      <ClientCTA />
    </PageFrame>
  );
}
