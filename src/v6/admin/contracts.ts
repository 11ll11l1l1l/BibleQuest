export type AdminPlatformRole = 'admin' | 'owner';

export type AdminTransportAction =
  | 'set_role'
  | 'set_congregation'
  | 'remove_congregation'
  | 'set_congregation_role'
  | 'create_small_group'
  | 'set_group_membership'
  | 'set_group_owner'
  | 'delete_user'
  | 'suspend_account'
  | 'reactivate_account'
  | 'force_sign_out'
  | 'set_temp_password'
  | 'change_email';

export type AdminAuditAction =
  | 'set_role'
  | 'set_congregation'
  | 'remove_congregation'
  | 'set_congregation_role'
  | 'create_small_group'
  | 'set_group_membership'
  | 'set_group_owner'
  | 'delete_account'
  | 'suspend_account'
  | 'reactivate_account'
  | 'force_sign_out'
  | 'set_temp_password'
  | 'change_email';

export type AdminAuthority = 'admin-or-owner' | 'owner-only' | 'conditional-owner';
export type AdminAuditMode = 'best-effort-after' | 'required-before-and-after';

export interface AdminActionPolicy {
  readonly transportAction: AdminTransportAction;
  readonly auditAction: AdminAuditAction;
  readonly authority: AdminAuthority;
  readonly auditMode: AdminAuditMode;
  readonly targetUser: 'required' | 'optional' | 'none';
  readonly revokesSessions: boolean;
  readonly terminatesAccount: boolean;
  readonly offline: 'forbidden';
  readonly sensitiveInputKeys: readonly string[];
}

const policies: readonly AdminActionPolicy[] = Object.freeze([
  Object.freeze({
    transportAction: 'set_role',
    auditAction: 'set_role',
    authority: 'conditional-owner',
    auditMode: 'best-effort-after',
    targetUser: 'required',
    revokesSessions: false,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'set_congregation',
    auditAction: 'set_congregation',
    authority: 'conditional-owner',
    auditMode: 'best-effort-after',
    targetUser: 'required',
    revokesSessions: false,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'remove_congregation',
    auditAction: 'remove_congregation',
    authority: 'conditional-owner',
    auditMode: 'best-effort-after',
    targetUser: 'required',
    revokesSessions: false,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'set_congregation_role',
    auditAction: 'set_congregation_role',
    authority: 'conditional-owner',
    auditMode: 'best-effort-after',
    targetUser: 'required',
    revokesSessions: false,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'create_small_group',
    auditAction: 'create_small_group',
    authority: 'admin-or-owner',
    auditMode: 'best-effort-after',
    targetUser: 'none',
    revokesSessions: false,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'set_group_membership',
    auditAction: 'set_group_membership',
    authority: 'admin-or-owner',
    auditMode: 'best-effort-after',
    targetUser: 'required',
    revokesSessions: false,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'set_group_owner',
    auditAction: 'set_group_owner',
    authority: 'admin-or-owner',
    auditMode: 'best-effort-after',
    targetUser: 'required',
    revokesSessions: false,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'delete_user',
    auditAction: 'delete_account',
    authority: 'owner-only',
    auditMode: 'required-before-and-after',
    targetUser: 'required',
    revokesSessions: false,
    terminatesAccount: true,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'suspend_account',
    auditAction: 'suspend_account',
    authority: 'admin-or-owner',
    auditMode: 'required-before-and-after',
    targetUser: 'required',
    revokesSessions: true,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'reactivate_account',
    auditAction: 'reactivate_account',
    authority: 'admin-or-owner',
    auditMode: 'required-before-and-after',
    targetUser: 'required',
    revokesSessions: false,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'force_sign_out',
    auditAction: 'force_sign_out',
    authority: 'admin-or-owner',
    auditMode: 'required-before-and-after',
    targetUser: 'required',
    revokesSessions: true,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze([]),
  }),
  Object.freeze({
    transportAction: 'set_temp_password',
    auditAction: 'set_temp_password',
    authority: 'owner-only',
    auditMode: 'required-before-and-after',
    targetUser: 'required',
    revokesSessions: true,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze(['password']),
  }),
  Object.freeze({
    transportAction: 'change_email',
    auditAction: 'change_email',
    authority: 'owner-only',
    auditMode: 'required-before-and-after',
    targetUser: 'required',
    revokesSessions: true,
    terminatesAccount: false,
    offline: 'forbidden',
    sensitiveInputKeys: Object.freeze(['email']),
  }),
]);

export const ADMIN_ACTION_POLICIES = policies;

const policyByTransport = new Map<AdminTransportAction, AdminActionPolicy>(
  policies.map((policy) => [policy.transportAction, policy]),
);

const auditActions = new Set<AdminAuditAction>(policies.map((policy) => policy.auditAction));

export function adminActionPolicy(action: string): AdminActionPolicy {
  const normalized = String(action ?? '').trim() as AdminTransportAction;
  const policy = policyByTransport.get(normalized);
  if (!policy) throw new Error(`Unknown V6 Admin transport action: ${normalized || '(blank)'}`);
  return policy;
}

export function auditActionForTransport(action: string): AdminAuditAction {
  return adminActionPolicy(action).auditAction;
}

export function assertAdminMutationAllowed(
  action: string,
  { online = true }: { readonly online?: boolean } = {},
): AdminActionPolicy {
  const policy = adminActionPolicy(action);
  if (policy.offline === 'forbidden' && online !== true) {
    const error = new Error('Admin changes require an online connection.');
    (error as Error & { code?: string }).code = 'BQ_ADMIN_OFFLINE_FORBIDDEN';
    throw error;
  }
  return policy;
}

const sensitiveAuditKeys = new Set([
  'password',
  'temppassword',
  'newpassword',
  'email',
  'oldemail',
  'newemail',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'jwt',
  'secret',
  'servicekey',
  'servicerolekey',
  'vapidprivatekey',
]);

function normalizedKey(value: string): string {
  return String(value ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function inspectAuditValue(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectAuditValue(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (sensitiveAuditKeys.has(normalizedKey(key))) {
      throw new Error(`Admin audit detail contains forbidden sensitive field at ${path}.${key}`);
    }
    inspectAuditValue(nested, `${path}.${key}`);
  }
}

export function assertSafeAdminAuditDetail(detail: unknown): Readonly<Record<string, unknown>> {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
    throw new Error('Admin audit detail must be an object.');
  }
  inspectAuditValue(detail, 'detail');
  return Object.freeze({ ...(detail as Record<string, unknown>) });
}

export interface AdminAuditRecord {
  readonly id: string;
  readonly actorId: string | null;
  readonly targetUserId: string | null;
  readonly action: AdminAuditAction;
  readonly detail: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

function optionalId(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return normalized;
}

export function parseAdminAuditRecord(raw: unknown): AdminAuditRecord {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Admin audit record must be an object.');
  }
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? '').trim();
  const action = String(row.action ?? '').trim() as AdminAuditAction;
  const createdAt = String(row.created_at ?? row.createdAt ?? '').trim();
  if (!id) throw new Error('Admin audit record requires an id.');
  if (!auditActions.has(action)) throw new Error(`Unknown Admin audit action: ${action || '(blank)'}`);
  if (!createdAt || Number.isNaN(Date.parse(createdAt))) {
    throw new Error('Admin audit record requires a valid created_at timestamp.');
  }
  return Object.freeze({
    id,
    actorId: optionalId(row.actor_id ?? row.actorId),
    targetUserId: optionalId(row.target_user_id ?? row.targetUserId),
    action,
    detail: assertSafeAdminAuditDetail(row.detail ?? {}),
    createdAt: new Date(createdAt).toISOString(),
  });
}
