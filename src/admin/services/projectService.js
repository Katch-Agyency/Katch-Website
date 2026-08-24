import {
  collection,
  doc,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseServices } from '../firebase';

export const PROJECT_STATUSES = ['New', 'Contacted', 'In Discussion', 'Proposal Sent', 'Won', 'Lost', 'Archived'];
export const PROJECT_TYPES = [
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

function toProject(snapshot) {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name || '',
    email: data.email || '',
    company: data.company || '',
    projectType: data.projectType || '',
    projectDetails: data.projectDetails || '',
    currentWebsite: data.currentWebsite || '',
    status: PROJECT_STATUSES.includes(data.status) ? data.status : 'New',
    notes: data.notes || '',
    createdAt: data.createdAt?.toDate?.() || null,
    updatedAt: data.updatedAt?.toDate?.() || null,
  };
}

function projectsCollection() {
  const { db } = getFirebaseServices();
  return collection(db, 'projects');
}

export function subscribeToRecentProjects(onData, onError, resultLimit = 8) {
  const recentQuery = query(projectsCollection(), orderBy('createdAt', 'desc'), limit(resultLimit));
  return onSnapshot(recentQuery, (snapshot) => {
    onData(snapshot.docs.map(toProject));
  }, () => onError(new Error('projects_unavailable')));
}

export function subscribeToProjects(onData, onError, resultLimit = 100) {
  const projectsQuery = query(projectsCollection(), orderBy('createdAt', 'desc'), limit(resultLimit));
  return onSnapshot(projectsQuery, (snapshot) => {
    onData(snapshot.docs.map(toProject));
  }, () => onError(new Error('projects_unavailable')));
}

export function subscribeToProject(projectId, onData, onError) {
  const { db } = getFirebaseServices();
  return onSnapshot(doc(db, 'projects', projectId), (snapshot) => {
    onData(toProject(snapshot));
  }, () => onError(new Error('project_unavailable')));
}

export async function loadDashboardCounts() {
  const collectionReference = projectsCollection();
  const [total, newProjects, inDiscussion, won] = await Promise.all([
    getCountFromServer(collectionReference),
    getCountFromServer(query(collectionReference, where('status', '==', 'New'))),
    getCountFromServer(query(collectionReference, where('status', '==', 'In Discussion'))),
    getCountFromServer(query(collectionReference, where('status', '==', 'Won'))),
  ]);
  return {
    total: total.data().count,
    new: newProjects.data().count,
    inDiscussion: inDiscussion.data().count,
    won: won.data().count,
  };
}

export async function updateProjectStatus(projectId, status) {
  if (!PROJECT_STATUSES.includes(status)) throw new Error('invalid_status');
  const { db } = getFirebaseServices();
  await updateDoc(doc(db, 'projects', projectId), { status, updatedAt: serverTimestamp() });
}

export async function updateProjectNotes(projectId, notes) {
  const cleanNotes = String(notes || '').trim().slice(0, 10_000);
  const { db } = getFirebaseServices();
  await updateDoc(doc(db, 'projects', projectId), { notes: cleanNotes, updatedAt: serverTimestamp() });
}
