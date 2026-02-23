import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Button, Icon, Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '../../components/ui';
import api from '../../api/client';

const PageHeader = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;`;
const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const StatusBadge = styled.span<{status:string}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({status})=>status==='approved'?'#dcfce7':status==='rejected'?'#fee2e2':'#fef3c7'};color:${({status})=>status==='approved'?'#16a34a':status==='rejected'?'#dc2626':'#d97706'};`;
const ActionBtn = styled.button`background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:6px;color:#6b7280;&:hover{background:#f3f4f6;}`;
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;`;
const ModalBox = styled.div`background:#fff;border-radius:16px;min-width:420px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.2);`;
const ModalTitle = styled.h3`font-size:18px;font-weight:600;margin:0 0 20px;`;
const FieldGroup = styled.div`display:flex;flex-direction:column;gap:6px;margin-bottom:16px;`;
const FieldLabel = styled.label`font-size:13px;font-weight:500;color:#374151;`;
const StyledInput = styled.input`width:100%;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;&:focus{border-color:#2E6DA4;}`;
const StyledSelect = styled.select`width:100%;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;background:#fff;box-sizing:border-box;&:focus{border-color:#2E6DA4;}`;
const ModalFooter = styled.div`display:flex;gap:10px;justify-content:flex-end;margin-top:8px;`;

const TimeEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({client_id:'',campaign_id:'',hours:'',date:new Date().toISOString().split('T')[0],description:''});
  const [saving, setSaving] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try { const r = await api.get('/time-entries'); setEntries(r.data.entries||r.data||[]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchEntries();
    api.get('/clients').then(r=>setClients(r.data.clients||r.data||[])).catch(()=>{});
  }, []);

  const onClientChange = async (clientId:string) => {
    setForm(f=>({...f,client_id:clientId,campaign_id:''}));
    if(clientId) {
      try { const r = await api.get(`/clients/${clientId}/campaigns`); setCampaigns(r.data.campaigns||r.data||[]); }
      catch { setCampaigns([]); }
    } else { setCampaigns([]); }
  };

  const handleSave = async () => {
    if(!form.campaign_id||!form.hours||!form.date) return;
    setSaving(true);
    try {
      await api.post('/time-entries', {campaign_id:parseInt(form.campaign_id),hours:parseFloat(form.hours),date:form.date,description:form.description});
      setShowModal(false); fetchEntries();
    } catch(e){console.error(e);}
    finally{setSaving(false);}
  };

  const handleApprove = async (id:number) => { await api.put(`/time-entries/${id}/approve`); fetchEntries(); };
  const handleReject = async (id:number) => { await api.put(`/time-entries/${id}/reject`); fetchEntries(); };

  return (
    <div>
      <PageHeader>
        <PageTitle>All Time Entries</PageTitle>
        <Button variant="primary" startIcon={<Icon name="plus" size={16}/>} onClick={()=>setShowModal(true)}>Log Hours</Button>
      </PageHeader>
      <Card>
        <Table>
          <TableHead><TableRow>
            <TableCellHeader>Employee</TableCellHeader>
            <TableCellHeader>Client</TableCellHeader>
            <TableCellHeader>Campaign</TableCellHeader>
            <TableCellHeader>Hours</TableCellHeader>
            <TableCellHeader>Date</TableCellHeader>
            <TableCellHeader>Status</TableCellHeader>
            <TableCellHeader>Actions</TableCellHeader>
          </TableRow></TableHead>
          <TableBody>
            {loading&&<TableRow><TableCell colSpan={7} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>Loading...</TableCell></TableRow>}
            {!loading&&entries.length===0&&<TableRow><TableCell colSpan={7} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>No time entries yet.</TableCell></TableRow>}
            {entries.map((e:any)=>(
              <TableRow key={e.id}>
                <TableCell style={{fontSize:13}}>{e.user_name}</TableCell>
                <TableCell style={{fontSize:13}}>{e.client_name||'—'}</TableCell>
                <TableCell style={{fontSize:13}}>{e.campaign_name||'—'}</TableCell>
                <TableCell style={{fontWeight:600,color:'#2E6DA4'}}>{e.hours}h</TableCell>
                <TableCell style={{fontSize:13,color:'#6b7280'}}>{new Date(e.date).toLocaleDateString()}</TableCell>
                <TableCell><StatusBadge status={e.status}>{e.status}</StatusBadge></TableCell>
                <TableCell>
                  {e.status==='pending'&&<>
                    <ActionBtn onClick={()=>handleApprove(e.id)} title="Approve"><Icon name="check" size={16}/></ActionBtn>
                    <ActionBtn onClick={()=>handleReject(e.id)} title="Reject"><Icon name="cross" size={16}/></ActionBtn>
                  </>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {showModal&&(
        <Overlay><ModalBox>
          <ModalTitle>Log Hours</ModalTitle>
          <FieldGroup><FieldLabel>Client</FieldLabel><StyledSelect value={form.client_id} onChange={e=>onClientChange(e.target.value)}><option value="">Select client...</option>{clients.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</StyledSelect></FieldGroup>
          <FieldGroup><FieldLabel>Campaign</FieldLabel><StyledSelect value={form.campaign_id} onChange={e=>setForm({...form,campaign_id:e.target.value})}><option value="">Select campaign...</option>{campaigns.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</StyledSelect></FieldGroup>
          <FieldGroup><FieldLabel>Hours</FieldLabel><StyledInput type="number" min="0.25" max="24" step="0.25" value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})} placeholder="e.g. 2.5"/></FieldGroup>
          <FieldGroup><FieldLabel>Date</FieldLabel><StyledInput type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></FieldGroup>
          <FieldGroup><FieldLabel>Description</FieldLabel><StyledInput value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What did you work on?"/></FieldGroup>
          <ModalFooter>
            <Button variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isDisabled={saving}>{saving?'Saving...':'Log Hours'}</Button>
          </ModalFooter>
        </ModalBox></Overlay>
      )}
    </div>
  );
};

export default TimeEntriesPage;
