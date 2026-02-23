import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Button, Icon, Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '../../components/ui';
import api from '../../api/client';

const PageHeader = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;`;
const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const StatusBadge = styled.span<{active:boolean}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({active})=>active?"#dcfce7":"#f3f4f6"};color:${({active})=>active?"#16a34a":"#6b7280"};`;
const ActionBtn = styled.button`background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:6px;color:#6b7280;&:hover{background:#f3f4f6;color:#1a1a2e;}`;
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;`;
const ModalBox = styled.div`background:#fff;border-radius:16px;min-width:400px;max-width:500px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.2);`;
const ModalTitle = styled.h3`font-size:18px;font-weight:600;margin:0 0 20px;color:#1a1a2e;`;
const FieldGroup = styled.div`display:flex;flex-direction:column;gap:6px;margin-bottom:16px;`;
const FieldLabel = styled.label`font-size:13px;font-weight:500;color:#374151;`;
const StyledInput = styled.input`width:100%;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;&:focus{border-color:#2E6DA4;}`;
const StyledSelect = styled.select`width:100%;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;background:#fff;box-sizing:border-box;&:focus{border-color:#2E6DA4;}`;
const ModalFooter = styled.div`display:flex;gap:10px;justify-content:flex-end;margin-top:8px;`;

interface Client { id:number;name:string;industry:string;status:string;contact_name:string;contact_email:string;created_at:string; }
const EMPTY = {name:'',industry:'',contact_name:'',contact_email:'',status:'active'};

const ClientsPage: React.FC = () => {
  const [clients,setClients] = useState<Client[]>([]);
  const [loading,setLoading] = useState(true);
  const [showModal,setShowModal] = useState(false);
  const [editClient,setEditClient] = useState<Client|null>(null);
  const [form,setForm] = useState(EMPTY);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const navigate = useNavigate();

  const fetch = async()=>{setLoading(true);try{const r=await api.get('/clients');setClients(r.data.clients||r.data||[]);}finally{setLoading(false);}};
  useEffect(()=>{fetch();},[]);

  const openAdd=()=>{setEditClient(null);setForm(EMPTY);setError('');setShowModal(true);};
  const openEdit=(c:Client)=>{setEditClient(c);setForm({name:c.name,industry:c.industry||'',contact_name:c.contact_name||'',contact_email:c.contact_email||'',status:c.status});setError('');setShowModal(true);};

  const handleSave=async()=>{
    if(!form.name.trim()){setError('Client name is required.');return;}
    setSaving(true);
    try{
      if(editClient){await api.put(`/clients/${editClient.id}`,form);}
      else{await api.post('/clients',form);}
      setShowModal(false);fetch();
    }catch(e:any){setError(e.response?.data?.message||'Save failed.');}
    finally{setSaving(false);}
  };

  const handleDelete=async(id:number)=>{
    if(!window.confirm('Delete this client?'))return;
    await api.delete(`/clients/${id}`);fetch();
  };

  return (
    <div>
      <PageHeader>
        <PageTitle>Clients</PageTitle>
        <Button variant="primary" startIcon={<Icon name="plus" size={16}/>} onClick={openAdd}>Add Client</Button>
      </PageHeader>
      <Card>
        <Table>
          <TableHead><TableRow>
            <TableCellHeader>Name</TableCellHeader>
            <TableCellHeader>Industry</TableCellHeader>
            <TableCellHeader>Contact</TableCellHeader>
            <TableCellHeader>Status</TableCellHeader>
            <TableCellHeader>Added</TableCellHeader>
            <TableCellHeader>Actions</TableCellHeader>
          </TableRow></TableHead>
          <TableBody>
            {loading&&<TableRow><TableCell colSpan={6} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>Loading…</TableCell></TableRow>}
            {!loading&&clients.length===0&&<TableRow><TableCell colSpan={6} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>No clients yet.</TableCell></TableRow>}
            {clients.map(c=>(
              <TableRow key={c.id}>
                <TableCell><button onClick={()=>navigate(`/clients/${c.id}`)} style={{background:'none',border:'none',cursor:'pointer',color:'#2E6DA4',fontWeight:600,fontSize:14,padding:0}}>{c.name}</button></TableCell>
                <TableCell>{c.industry||'—'}</TableCell>
                <TableCell><div style={{fontSize:13}}>{c.contact_name||'—'}</div>{c.contact_email&&<div style={{fontSize:11,color:'#9ca3af'}}>{c.contact_email}</div>}</TableCell>
                <TableCell><StatusBadge active={c.status==='active'}>{c.status}</StatusBadge></TableCell>
                <TableCell style={{fontSize:13,color:'#6b7280'}}>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <ActionBtn onClick={()=>openEdit(c)}><Icon name="edit" size={16}/></ActionBtn>
                  <ActionBtn onClick={()=>handleDelete(c.id)}><Icon name="bin" size={16}/></ActionBtn>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {showModal&&(
        <Overlay>
          <ModalBox>
            <ModalTitle>{editClient?'Edit Client':'Add New Client'}</ModalTitle>
            {error&&<p style={{color:'#dc2626',fontSize:13,marginBottom:12}}>{error}</p>}
            <FieldGroup><FieldLabel>Client Name *</FieldLabel><StyledInput value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Acme Corp"/></FieldGroup>
            <FieldGroup><FieldLabel>Industry</FieldLabel><StyledInput value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} placeholder="e.g. Healthcare"/></FieldGroup>
            <FieldGroup><FieldLabel>Contact Name</FieldLabel><StyledInput value={form.contact_name} onChange={e=>setForm({...form,contact_name:e.target.value})} placeholder="Primary contact"/></FieldGroup>
            <FieldGroup><FieldLabel>Contact Email</FieldLabel><StyledInput type="email" value={form.contact_email} onChange={e=>setForm({...form,contact_email:e.target.value})} placeholder="contact@client.com"/></FieldGroup>
            <FieldGroup><FieldLabel>Status</FieldLabel><StyledSelect value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></StyledSelect></FieldGroup>
            <ModalFooter>
              <Button variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} isDisabled={saving}>{saving?'Saving…':editClient?'Save Changes':'Add Client'}</Button>
            </ModalFooter>
          </ModalBox>
        </Overlay>
      )}
    </div>
  );
};

export default ClientsPage;
