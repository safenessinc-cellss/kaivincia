const fs = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, collection, query, where } = require('firebase/firestore');

const projectId = 'demo-kaivincia-security';
const rules = fs.readFileSync('firestore.rules', 'utf8');

async function main() {
  const env = await initializeTestEnvironment({ projectId, firestore: { rules } });
  try {
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const profiles = [
        ['alice', { role: 'agent', status: 'approved' }],
        ['bob', { role: 'agent', status: 'approved' }],
        ['pending', { role: 'agent', status: 'pending' }],
        ['admin', { role: 'admin', status: 'approved' }]
      ];
      for (const [uid, profile] of profiles) await setDoc(doc(db, 'users', uid), profile);
      await setDoc(doc(db, 'clients', 'alice-client'), { name: 'Alice Client', createdBy: 'alice', assignedTo: 'alice' });
      await setDoc(doc(db, 'clients', 'bob-client'), { name: 'Bob Client', createdBy: 'bob', assignedTo: 'bob' });
      await setDoc(doc(db, 'tasks', 'alice-task'), { title: 'Alice task', createdBy: 'alice', assignedTo: 'alice' });
      await setDoc(doc(db, 'chat_messages', 'private-message'), { type: 'private', senderId: 'alice', targetId: 'bob', text: 'private' });
      await setDoc(doc(db, 'chat_messages', 'general-message'), { type: 'groups', targetId: 'general', senderId: 'alice', text: 'general' });
      await setDoc(doc(db, 'chat_messages', 'devops-message'), { type: 'groups', targetId: 'dev-ops', senderId: 'admin', text: 'internal' });
      await setDoc(doc(db, 'telnyx_sip_credentials', 'alice-sip'), { assignedTo: 'alice', secret: 'test-only' });
    });

    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    const pending = env.authenticatedContext('pending').firestore();
    const admin = env.authenticatedContext('admin').firestore();

    await assertSucceeds(getDoc(doc(alice, 'clients', 'alice-client')));
    await assertFails(getDoc(doc(alice, 'clients', 'bob-client')));
    await assertSucceeds(getDocs(query(collection(alice, 'clients'), where('createdBy', '==', 'alice'))));
    await assertFails(getDocs(collection(alice, 'clients')));
    await assertSucceeds(getDoc(doc(alice, 'tasks', 'alice-task')));
    await assertFails(getDoc(doc(bob, 'tasks', 'alice-task')));
    await assertFails(getDoc(doc(pending, 'clients', 'alice-client')));

    await assertSucceeds(getDoc(doc(alice, 'chat_messages', 'private-message')));
    await assertSucceeds(getDoc(doc(bob, 'chat_messages', 'private-message')));
    await assertSucceeds(getDoc(doc(alice, 'chat_messages', 'general-message')));
    await assertFails(getDoc(doc(alice, 'chat_messages', 'devops-message')));
    await assertSucceeds(getDoc(doc(admin, 'chat_messages', 'devops-message')));

    await assertSucceeds(getDoc(doc(alice, 'telnyx_sip_credentials', 'alice-sip')));
    await assertFails(getDoc(doc(bob, 'telnyx_sip_credentials', 'alice-sip')));
    await assertSucceeds(getDocs(collection(admin, 'clients')));

    console.log('Firestore security tests passed: ownership, scoped queries, pending accounts, private chat, group channel roles and SIP assignment.');
  } finally {
    await env.cleanup();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
