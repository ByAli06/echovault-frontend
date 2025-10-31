import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// SUPABASE
const supabase = createClient(
    'https://lhsneximiefktlrhwfvj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxoc25leGltaWVma3Rscmh3ZnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDkzNDEsImV4cCI6MjA3NzQ4NTM0MX0.RRYVmkDovByWenwUIAW6kI9JdVPlI5Yok1KGaBQ_cS4'
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
    };

    const createVault = async () => {
        if (!voiceFile) return alert('Ses seç!');
        const filePath = `${user.id}/voice.wav`;
        const { error } = await supabase.storage.from('voices').upload(filePath, voiceFile, { upsert: true });
        if (error) return alert(error.message);

        const { data } = await supabase.from('vaults')
            .insert({ user_id: user.id, voice_sample: filePath, personality_prompt: 'Sýcakkanlý, bilge' })
            .select()
            .single();
        setVaultId(data.id);
        alert('AI hazýr!');
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
            <div style={{ padding: '40px', textAlign: 'center', background: '#000', color: '#fff', minHeight: '100vh' }}>
                <h1>EchoVault</h1>
                <p>Ölmeden önce sesini býrak.</p>
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
            <h2>Hoþ geldin, {name}!</h2>
            <button onClick={() => setUser(null)} style={{ color: 'red' }}>Çýkýþ</button>

            {!vaultId ? (
                <>
                    <h3>Ses Yükle</h3>
                    <input type="file" accept="audio/*" onChange={e => setVoiceFile(e.target.files[0])} />
                    <button onClick={createVault}>Kasa Oluþtur</button>
                </>
            ) : (
                <>
                    <h3>AI ile Konuþ</h3>
                    <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Mesaj..." />
                    <button onClick={sendToAI}>Gönder</button>
                    {aiResponse && <p><strong>AI:</strong> {aiResponse}</p>}
                </>
            )}
        </div>
    );
}

export default App;