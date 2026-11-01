const fs = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, collection, query, where, updateDoc } = require('firebase/firestore');

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
      await setDoc(doc(db, 'voip_call_history', 'alice-call'), { agentId: 'alice', contactPhone: '+15555550100' });
      await setDoc(doc(db, 'esim_profiles', 'admin-esim'), { isDemo: false, phone: '+15555550101' });
      await setDoc(doc(db, 'telnyx_phone_numbers', 'admin-number'), { phoneNumber: '+15555550102' });
      await setDoc(doc(db, 'telnyx_agent_assignments', 'alice'), { agentId: 'alice', authorizedNumbers: ['+15555550102'] });
    });

    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    const pending = env.authenticatedContext('pending').firestore();
    const admin = env.authenticatedContext('admin').firestore();

    await assertSucceeds(getDoc(doc(alice, 'clients', 'alice-client')));
    await assertSucceeds(setDoc(doc(alice, 'clients', 'alice-new-client'), { name: 'New client', createdBy: 'alice' }));
    await assertFails(setDoc(doc(bob, 'clients', 'forged-client'), { name: 'Forged', createdBy: 'alice' }));
    await assertFails(setDoc(doc(pending, 'tasks', 'pending-task'), { title: 'Pending', createdBy: 'pending', assignedTo: 'pending' }));
    await assertFails(getDoc(doc(alice, 'clients', 'bob-client')));
    await assertFails(updateDoc(doc(alice, 'clients', 'alice-client'), { assignedTo: 'bob' }));
    await assertSucceeds(updateDoc(doc(admin, 'clients', 'alice-client'), { assignedTo: 'bob' }));
    await assertSucceeds(getDocs(query(collection(alice, 'clients'), where('createdBy', '==', 'alice'))));
    await assertFails(getDocs(collection(alice, 'clients')));
    await assertSucceeds(getDoc(doc(alice, 'tasks', 'alice-task')));
    await assertFails(getDoc(doc(bob, 'tasks', 'alice-task')));
    await assertFails(getDoc(doc(pending, 'clients', 'alice-client')));

    await assertSucceeds(getDoc(doc(alice, 'chat_messages', 'private-message')));
    await assertSucceeds(getDoc(doc(bob, 'chat_messages', 'private-message')));
    await assertSucceeds(getDoc(doc(alice, 'chat_messages', 'general-message')));
    await assertFails(getDoc(doc(alice, 'chat_messages', 'devops-message')));
    await assertFails(setDoc(doc(alice, 'chat_messages', 'devops-forged'), { type: 'groups', targetId: 'dev-ops', senderId: 'alice' }));
    await assertSucceeds(setDoc(doc(alice, 'chat_messages', 'general-new'), { type: 'groups', targetId: 'general', senderId: 'alice' }));
    await assertSucceeds(getDoc(doc(admin, 'chat_messages', 'devops-message')));

    await assertSucceeds(getDoc(doc(alice, 'telnyx_sip_credentials', 'alice-sip')));
    await assertFails(setDoc(doc(bob, 'chat_messages', 'forged-private'), { type: 'private', senderId: 'alice', targetId: 'bob' }));
    await assertFails(getDoc(doc(bob, 'telnyx_sip_credentials', 'alice-sip')));
    await assertSucceeds(getDoc(doc(alice, 'voip_call_history', 'alice-call')));
    await assertFails(getDoc(doc(bob, 'voip_call_history', 'alice-call')));
    await assertSucceeds(getDoc(doc(alice, 'telnyx_agent_assignments', 'alice')));
    await assertFails(getDoc(doc(bob, 'telnyx_agent_assignments', 'alice')));
    await assertFails(getDoc(doc(alice, 'esim_profiles', 'admin-esim')));
    await assertSucceeds(getDoc(doc(admin, 'esim_profiles', 'admin-esim')));
    await assertFails(getDoc(doc(alice, 'telnyx_phone_numbers', 'admin-number')));
    await assertSucceeds(getDoc(doc(admin, 'telnyx_phone_numbers', 'admin-number')));
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
