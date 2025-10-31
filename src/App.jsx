import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// SUPABASE
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// BACKEND
const BACKEND_URL = 'https://echovault-backend-production.up.railway.app';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [voiceFile, setVoiceFile] = useState(null);
  const [message, setMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [vaultId, setVaultId] = useState(null);

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password: '123456' });
    if (error) return alert(error.message);
    setUser(data.user);
    await supabase.from('users').upsert({ id: data.user.id, email, full_name: name });
    alert('Kayit basarili!');
  };

  const createVault = async () => {
    if (!voiceFile) return alert('Ses dosyasi sec!');
    const filePath = `${user.id}/voice.wav`;
    const { error } = await supabase.storage.from('voices').upload(filePath, voiceFile, { upsert: true });
    if (error) return alert(error.message);

    const { data } = await supabase.from('vaults')
      .insert({ user_id: user.id, voice_sample: filePath, personality_prompt: 'Sicakkanli, bilge' })
      .select()
      .single();
    setVaultId(data.id);
    alert('AI seni ogrendi!');
  };

  const sendToAI = async () => {
    if (!message) return;
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vault_id: vaultId, message, user_id: user.id })
    });
    const { response } = await res.json();
    setAiResponse(response);
  };

  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Arial' }}>
        <h1>EchoVault</h1>
        <p>Oelmeden oence sesini birak.</p>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '80%', padding: '12px', margin: '10px 0' }} />
        <input placeholder="Ad" value={name} onChange={e => setName(e.target.value)} style={{ width: '80%', padding: '12px', margin: '10px 0' }} />
        <button onClick={signUp} style={{ padding: '14px 32px', background: '#fff', color: '#000', borderRadius: '8px' }}>
          Kaydol
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: 'auto', background: '#111', color: '#eee' }}>
      <h2>Hos geldin, {name}!</h2>
      <button onClick={() => setUser(null)} style={{ color: 'red' }}>Cikis</button>

      {!vaultId ? (
        <>
          <h3>Ses Yukle</h3>
          <input type="file" accept="audio/*" onChange={e => setVoiceFile(e.target.files[0])} />
          <button onClick={createVault}>Kasa Olustur</button>
        </>
      ) : (
        <>
          <h3>AI ile Konus</h3>
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Mesaj..." />
          <button onClick={sendToAI}>Gonder</button>
          {aiResponse && <p><strong>AI:</strong> {aiResponse}</p>}
        </>
      )}
    </div>
  );
}

export default App;
