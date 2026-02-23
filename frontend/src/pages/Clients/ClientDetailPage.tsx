import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { Button, Icon, Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '@ssa-ui-kit/core';
import api from '../../api/client';

const Breadcrumb = styled.div`font-size:13px;color:#6b7280;margin-bottom:20px;a{color:#2E6DA4;text-decoration:none;}`;
const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 24px;`;
const SectionTitle = styled.h3`font-size:16px;font-weight:600;color:#1a1a2e;margin:28px 0 12px;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const InfoGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;padding:20px;`;
const InfoLabel = styled.div`font-size:11px;font-weight:600;text-transform:uppercase;color:#9ca3af;letter-spacing:0.5px;margin-bottom:4px;`;
const InfoValue = styled.div`font-size:14px;color:#1a1a2e;font-weight:500;`;
const StatusBadge = styled.span<{active:boolean}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({active})=>active?'#dcfce7':'#f3f4f6'};color:${({active})=>active?'#16a34a':'#6b7280'};`;
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;`;
const ModalBox = styled.div`background:#fff;border-radius:16px;min-width:400px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.2);`;
const ModalTitle = styled.h3`font-size:18px;font-weight:600;margin:0 0 20px;`;
const FieldGroup = styled.div`display:flex;flex-direction:column;gap:6px;margin-bottom:16px;`;
const FieldLabel = styled.label`font-size:13px;font-weight:500;color:#374151;`;
const StyledInput = styled.input`width:100%;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;&:focus{border-color:#2E6DA4;}`;
const ModalFooter = styled.div`display:flex;gap:10px;justify-content:flex-end;margin-top:8px;`;

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{id:string}>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccModal, setShowAccModal] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [accForm, setAccForm] = useState({name:'',platform:'',status:'active'});
  const [webForm, setWebForm] = useState({name:'',url:'',status:'active'});
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, aRes, wRes] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/clients/${id}/accounts`).catch(()=>({data:{accounts:[]}})),
        api.get(`/clients/${id}/websites`).catch(()=>({data:{websites:[]}})),
      ]);
      setClient(cRes.data.client || cRes.data);
      setAccounts(aRes.data.accounts || aRes.data || []);
      setWebsites(wRes.data.websites || wRes.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const saveAccount = async () => {
    setSaving(true);
    try { await api.post(`/clients/${id}/accounts`, accForm); setShowAccModal(false); fetchAll(); }
    catch(e) { console.error(e); } finally { setSaving(false); }
  };

  const saveWebsite = async () => {
    setSaving(true);
    try { await api.post(`/clients/${id}/websites`, webForm); setShowWebModal(false); fetchAll(); }
    catch(e) { console.error(e); } finally { setSaving(false); }
  };

  if (loading) return <div style={{padding:40,color:'#9ca3af'}}>Loading...</div>;
  if (!client) return <div style={{padding:40,color:'#dc2626'}}>Client not found.</div>;

  return (
    <div>
      <Breadcrumb><Link to="/clients">Clients</Link> / {client.name}</Breadcrumb>
      <PageTitle>{client.name}</PageTitle>
      <Card>
        <InfoGrid>
          <div><InfoLabel>Industry</InfoLabel><InfoValue>{client.industry||'—'}</InfoValue></div>
          <div><InfoLabel>Contact</InfoLabel><InfoValue>{client.contact_name||'—'}</InfoValue></div>
          <div><InfoLabel>Email</InfoLabel><InfoValue>{client.contact_email||'—'}</InfoValue></div>
          <div><InfoLabel>Status</InfoLabel><InfoValue><StatusBadge active={client.status==='active'}>{client.status}</StatusBadge></InfoValue></div>
        </InfoGrid>
      </Card>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <SectionTitle>Ad Accounts ({accounts.length})</SectionTitle>
        <Button variant="primary" size="small" startIcon={<Icon name="plus" size={14}/>} onClick={()=>{setAccForm({name:'',platform:'',status:'active'});setShowAccModal(true);}}>Add Account</Button>
      </div>
      <Card>
        <Table>
          <TableHead><TableRow><TableCellHeader>Name</TableCellHeader><TableCellHeader>Platform</TableCellHeader><TableCellHeader>Status</TableCellHeader></TableRow></TableHead>
          <TableBody>
            {accounts.length===0&&<TableRow><TableCell colSpan={3} style={{textAlign:'center',color:'#9ca3af',padding:'20px'}}>No accounts yet.</TableCell></TableRow>}
            {accounts.map((a:any)=>(
              <TableRow key={a.id}>
                <TableCell><button onClick={()=>navigate(`/accounts/${a.id}`)} style={{background:'none',border:'none',cursor:'pointer',color:'#2E6DA4',fontWeight:600,fontSize:14,padding:0}}>{a.name}</button></TableCell>
                <TableCell>{a.platform||'—'}</TableCell>
                <TableCell><StatusBadge active={a.status==='active'}>{a.status}</StatusBadge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <SectionTitle>Websites ({websites.length})</SectionTitle>
        <Button variant="primary" size="small" startIcon={<Icon name="plus" size={14}/>} onClick={()=>{setWebForm({name:'',url:'',status:'active'});setShowWebModal(true);}}>Add Website</Button>
      </div>
      <Card>
        <Table>
          <TableHead><TableRow><TableCellHeader>Name</TableCellHeader><TableCellHeader>URL</TableCellHeader><TableCellHeader>Status</TableCellHeader></TableRow></TableHead>
          <TableBody>
            {websites.length===0&&<TableRow><TableCell colSpan={3} style={{textAlign:'center',color:'#9ca3af',padding:'20px'}}>No websites yet.</TableCell></TableRow>}
            {websites.map((w:any)=>(
              <TableRow key={w.id}>
                <TableCell><button onClick={()=>navigate(`/websites/${w.id}`)} style={{background:'none',border:'none',cursor:'pointer',color:'#2E6DA4',fontWeight:600,fontSize:14,padding:0}}>{w.name}</button></TableCell>
                <TableCell style={{fontSize:13}}>{w.url||'—'}</TableCell>
                <TableCell><StatusBadge active={w.status==='active'}>{w.status}</StatusBadge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {showAccModal&&(
        <Overlay><ModalBox>
          <ModalTitle>Add Ad Account</ModalTitle>
          <FieldGroup><FieldLabel>Account Name</FieldLabel><StyledInput value={accForm.name} onChange={e=>setAccForm({...accForm,name:e.target.value})} placeholder="e.g. Google Ads - Brand"/></FieldGroup>
          <FieldGroup><FieldLabel>Platform</FieldLabel><StyledInput value={accForm.platform} onChange={e=>setAccForm({...accForm,platform:e.target.value})} placeholder="e.g. Google Ads, Meta"/></FieldGroup>
          <ModalFooter>
            <Button variant="secondary" onClick={()=>setShowAccModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveAccount} isDisabled={saving}>{saving?'Saving...':'Add Account'}</Button>
          </ModalFooter>
        </ModalBox></Overlay>
      )}
      {showWebModal&&(
        <Overlay><ModalBox>
          <ModalTitle>Add Website</ModalTitle>
          <FieldGroup><FieldLabel>Website Name</FieldLabel><StyledInput value={webForm.name} onChange={e=>setWebForm({...webForm,name:e.target.value})} placeholder="e.g. Main Website"/></FieldGroup>
          <FieldGroup><FieldLabel>URL</FieldLabel><StyledInput value={webForm.url} onChange={e=>setWebForm({...webForm,url:e.target.value})} placeholder="https://example.com"/></FieldGroup>
          <ModalFooter>
            <Button variant="secondary" onClick={()=>setShowWebModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveWebsite} isDisabled={saving}>{saving?'Saving...':'Add Website'}</Button>
          </ModalFooter>
        </ModalBox></Overlay>
      )}
    </div>
  );
};

export default ClientDetailPage;
