import { ArrowDownRight, ArrowUpRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projects } from '../data/projects';

function ProjectCard({ project, layout, priority = false }) {
  const casePath = `/demos/${project.id}`;

  return (
    <article className={`project-card project-card--${layout} reveal`}>
      <div className="project-visual">
        <Link to={casePath} aria-label={`View the ${project.name} demo details`}>
          <img
            src={project.image}
            srcSet={`${project.imageXSmall} 480w, ${project.imageSmall} 760w, ${project.image} 1440w`}
            sizes={layout === 'wide' ? '(max-width: 820px) 92vw, 92vw' : '(max-width: 820px) 92vw, 46vw'}
            alt={project.imageAlt}
            width="1440"
            height="960"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
          />
          <span className="visual-action" aria-hidden="true">
            View Case Study <ArrowUpRight size={16} />
          </span>
        </Link>
        <span className="project-number" aria-hidden="true">{project.number}</span>
      </div>
      <div className="project-card-body">
        <div className="project-card-heading">
          <p>{project.category}</p>
          <h3><Link to={casePath}>{project.name}</Link></h3>
        </div>
        <div className="project-card-copy">
          <p>{project.description}</p>
          <ul aria-label={`${project.name} project capabilities`}>
            {project.capabilities.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="project-links">
            <Link className="case-link" to={casePath}>
              View Case Study <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              View Live Website <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProjectGrid({ items = projects }) {
  return (
    <div className="demo-grid shell">
      {items.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          layout={index === 0 || (items.length === 4 && index === 3) ? 'wide' : 'half'}
          priority={index === 0}
        />
      ))}
    </div>
  );
}

export function SelectedDemosPreview() {
  return (
    <section className="demos section" id="selected-demos" aria-labelledby="selected-demos-title">
      <div className="section-heading shell reveal">
        <div>
          <p className="eyebrow">Selected demos / 2026</p>
          <h2 id="selected-demos-title">Demos that show the standard.</h2>
        </div>
        <div className="section-heading-action">
          <p>Live demos built to show how strong customer journeys and focused business websites can feel.</p>
          <Link to="/demos">View Our Demos <ArrowDownRight aria-hidden="true" /></Link>
        </div>
      </div>
      <ProjectGrid items={projects.slice(0, 3)} />
    </section>
  );
}
