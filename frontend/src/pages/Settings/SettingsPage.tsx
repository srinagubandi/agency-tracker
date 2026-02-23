import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import api from '../../api/client';

const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 24px;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);padding:28px;max-width:600px;`;
const SectionTitle = styled.h3`font-size:16px;font-weight:600;color:#1a1a2e;margin:0 0 20px;`;
const FieldGroup = styled.div`display:flex;flex-direction:column;gap:6px;margin-bottom:20px;`;
const FieldLabel = styled.label`font-size:13px;font-weight:500;color:#374151;`;
const StyledInput = styled.input`width:100%;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;&:focus{border-color:#2E6DA4;}`;
const StyledSelect = styled.select`width:100%;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;background:#fff;box-sizing:border-box;&:focus{border-color:#2E6DA4;}`;
const Msg = styled('p', { shouldForwardProp: (prop) => prop !== 'success' })<{success?:boolean}>`font-size:13px;color:${({success})=>success?'#16a34a':'#dc2626'};padding:8px 12px;border-radius:6px;background:${({success})=>success?'#f0fdf4':'#fef2f2'};border:1px solid ${({success})=>success?'#bbf7d0':'#fecaca'};margin-bottom:16px;`;

const TIMEZONES = ['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Toronto','Europe/London','Europe/Paris','Australia/Sydney'];

const SettingsPage: React.FC = () => {
  const [form, setForm] = useState({agency_name:'Health Scale Digital',timezone:'America/New_York'});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r=>{
      const s = r.data.settings||r.data||{};
      setForm({agency_name:s.agency_name||'Health Scale Digital',timezone:s.timezone||'America/New_York'});
    }).catch(()=>{});
  }, []);

  const handleSave = async (e:React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      setSuccess(true); setMsg('Settings saved successfully!');
    } catch(err:any) {
      setSuccess(false); setMsg(err.response?.data?.message||'Failed to save settings.');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageTitle>Settings</PageTitle>
      <Card>
        <SectionTitle>Agency Settings</SectionTitle>
        {msg&&<Msg success={success}>{msg}</Msg>}
        <form onSubmit={handleSave}>
          <FieldGroup>
            <FieldLabel>Agency Name</FieldLabel>
            <StyledInput value={form.agency_name} onChange={e=>setForm({...form,agency_name:e.target.value})} placeholder="Your agency name"/>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Timezone</FieldLabel>
            <StyledSelect value={form.timezone} onChange={e=>setForm({...form,timezone:e.target.value})}>
              {TIMEZONES.map(tz=><option key={tz} value={tz}>{tz}</option>)}
            </StyledSelect>
          </FieldGroup>
          <button type="submit" disabled={saving} style={{padding:'10px 24px',background:'#2E6DA4',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:600,cursor:saving?'not-allowed':'pointer',opacity:saving?0.6:1}}>
            {saving?'Saving...':'Save Settings'}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default SettingsPage;
