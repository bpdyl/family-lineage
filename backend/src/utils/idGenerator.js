import { nanoid } from 'nanoid';

export function generateMemberId() {
  return `m_${nanoid(10)}`;
}

export function generateUserId() {
  return `u_${nanoid(10)}`;
}
