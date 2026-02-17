/**
 * Authentification — utilisateurs et rôles pour la plateforme SVT
 */

export type Role = "admin" | "teacher" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  /** Si true, l'élève doit définir un nouveau mot de passe (première connexion). */
  mustChangePassword?: boolean;
}

/** Tous les utilisateurs (pour le login et les listes) */
export const ALL_USERS: User[] = [
  {
    id: "1",
    name: "Admin SVT",
    email: "admin@svt-lycee.fr",
    role: "admin",
  },
  {
    id: "2",
    name: "Marie Dupont",
    email: "marie.dupont@svt-lycee.fr",
    role: "teacher",
  },
  {
    id: "3",
    name: "Lucas Martin",
    email: "lucas.martin@svt-lycee.fr",
    role: "student",
  },
  {
    id: "4",
    name: "Emma Bernard",
    email: "emma.bernard@svt-lycee.fr",
    role: "student",
  },
  {
    id: "5",
    name: "Hugo Petit",
    email: "hugo.petit@svt-lycee.fr",
    role: "student",
  },
  {
    id: "6",
    name: "Léa Moreau",
    email: "lea.moreau@svt-lycee.fr",
    role: "student",
  },
];

export const MOCK_USERS: Record<Role, User> = {
  admin: ALL_USERS[0]!,
  teacher: ALL_USERS[1]!,
  student: ALL_USERS[2]!,
};

const KEY_USERS = "svt-users";
const KEY_PASSWORDS = "svt-passwords"; // email -> password (simulé, à remplacer en prod)
const STORAGE_KEY_ROLE = "svt-auth-role";
const STORAGE_KEY_USER_ID = "svt-auth-user-id";
const STORAGE_KEY_LOGGED_IN = "svt-auth-logged-in";

const DEFAULT_PASSWORD = "demo"; // mot de passe commun pour la démo
const DEFAULT_STUDENT_PASSWORD = "eleve123";

export function getStoredRole(): Role | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY_ROLE);
  if (stored === "admin" || stored === "teacher" || stored === "student")
    return stored;
  return null;
}

export function setStoredRole(role: Role): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_ROLE, role);
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_USER_ID);
}

export function setStoredUserId(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_USER_ID, userId);
  localStorage.setItem(STORAGE_KEY_LOGGED_IN, "true");
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY_LOGGED_IN) === "true";
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_USER_ID);
  localStorage.removeItem(STORAGE_KEY_LOGGED_IN);
  localStorage.removeItem(STORAGE_KEY_ROLE);
}

function loadUsers(): User[] {
  if (typeof window === "undefined") return ALL_USERS;
  try {
    const raw = localStorage.getItem(KEY_USERS);
    if (!raw) return ALL_USERS;
    return JSON.parse(raw) as User[];
  } catch {
    return ALL_USERS;
  }
}

function saveUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
}

/** Liste des utilisateurs (stockée en localStorage, initiale = ALL_USERS) */
export function getUsers(): User[] {
  return loadUsers();
}

export function setUsers(users: User[]): void {
  saveUsers(users);
}

function loadPasswords(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY_PASSWORDS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function savePasswords(passwords: Record<string, string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_PASSWORDS, JSON.stringify(passwords));
}

/** Initialiser les mots de passe par défaut pour les utilisateurs existants */
function ensureDefaultPasswords(): void {
  const users = loadUsers();
  const passwords = loadPasswords();
  let changed = false;
  for (const u of users) {
    const key = u.email.toLowerCase();
    if (!passwords[key]) {
      passwords[key] = u.role === "student" ? DEFAULT_STUDENT_PASSWORD : DEFAULT_PASSWORD;
      changed = true;
    }
  }
  if (changed) savePasswords(passwords);
}

/** Authentification par email + mot de passe. Retourne l'utilisateur ou null. */
export function authenticate(email: string, password: string): User | null {
  ensureDefaultPasswords();
  const users = loadUsers();
  const passwords = loadPasswords();
  const emailNorm = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === emailNorm);
  if (!user) return null;
  const stored = passwords[emailNorm];
  if (!stored) return null;
  if (stored !== password.trim()) return null;
  return user;
}

/** Définir le mot de passe d'un utilisateur (pour nouveaux élèves). Clé = email en minuscules. */
export function setUserPassword(email: string, password: string): void {
  const passwords = loadPasswords();
  passwords[email.trim().toLowerCase()] = password;
  savePasswords(passwords);
}

/** Ajouter un élève (nom, email). Mot de passe par défaut = eleve123. Retourne le nouvel utilisateur. */
export function addStudent(name: string, email: string): User {
  const users = loadUsers();
  const emailNorm = email.trim().toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === emailNorm)) {
    throw new Error("Un utilisateur avec cet email existe déjà.");
  }
  const id = "s-" + Date.now();
  const newUser: User = { id, name: name.trim(), email: email.trim(), role: "student" };
  saveUsers([...users, newUser]);
  setUserPassword(newUser.email, DEFAULT_STUDENT_PASSWORD);
  return newUser;
}

/** Supprimer un utilisateur (élève). Retirer aussi des classes côté store. */
export function removeStudent(id: string): void {
  const users = loadUsers().filter((u) => u.id !== id);
  saveUsers(users);
}

export function getCurrentUser(): User {
  const userId = getStoredUserId();
  const users = loadUsers();
  if (userId) {
    const u = users.find((x) => x.id === userId);
    if (u) return u;
  }
  const role = getStoredRole() ?? "student";
  const fallback = users.find((x) => x.role === role) ?? users[0];
  return fallback ?? MOCK_USERS[role];
}

export function getStudents(): User[] {
  return loadUsers().filter((u) => u.role === "student");
}
