import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Button, Icon, Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '../../components/ui';
import api from '../../api/client';

const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 24px;`;
const Tabs = styled.div`display:flex;gap:4px;margin-bottom:24px;background:#f3f4f6;border-radius:10px;padding:4px;width:fit-content;`;
const Tab = styled.button<{active:boolean}>`padding:8px 20px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;background:${({active})=>active?'#fff':'transparent'};color:${({active})=>active?'#2E6DA4':'#6b7280'};box-shadow:${({active})=>active?'0 1px 4px rgba(0,0,0,0.1)':'none'};`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const FilterBar = styled.div`display:flex;gap:12px;margin-bottom:16px;align-items:center;flex-wrap:wrap;`;
const StyledInput = styled.input`padding:8px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;&:focus{border-color:#2E6DA4;}`;
const StyledSelect = styled.select`padding:8px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;background:#fff;&:focus{border-color:#2E6DA4;}`;
const TotalRow = styled.div`padding:12px 16px;background:#f8fafc;border-top:2px solid #e5e7eb;font-weight:600;font-size:14px;color:#1a1a2e;`;

const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState<'hours-by-employee'|'hours-by-client'|'hours-by-campaign'>('hours-by-employee');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');

  useEffect(() => {
    api.get('/clients').then(r=>setClients(r.data.clients||r.data||[])).catch(()=>{});
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if(dateFrom) params.set('from', dateFrom);
      if(dateTo) params.set('to', dateTo);
      if(selectedClient) params.set('client_id', selectedClient);
      const r = await api.get(`/reports/${tab}?${params}`);
      setData(r.data.report||r.data||[]);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [tab]);

  const totalHours = data.reduce((sum,row)=>sum+Number(row.total_hours||0),0);

  return (
    <div>
      <PageTitle>Reports</PageTitle>
      <Tabs>
        <Tab active={tab==='hours-by-employee'} onClick={()=>setTab('hours-by-employee')}>By Employee</Tab>
        <Tab active={tab==='hours-by-client'} onClick={()=>setTab('hours-by-client')}>By Client</Tab>
        <Tab active={tab==='hours-by-campaign'} onClick={()=>setTab('hours-by-campaign')}>By Campaign</Tab>
      </Tabs>
      <FilterBar>
        <StyledInput type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
        <StyledInput type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/>
        {tab!=='hours-by-client'&&<StyledSelect value={selectedClient} onChange={e=>setSelectedClient(e.target.value)}><option value="">All Clients</option>{clients.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</StyledSelect>}
        <Button variant="primary" size="small" startIcon={<Icon name="filter" size={14}/>} onClick={fetchReport}>Apply</Button>
      </FilterBar>
      <Card>
        <Table>
          <TableHead><TableRow>
            {tab==='hours-by-employee'&&<><TableCellHeader>Employee</TableCellHeader><TableCellHeader>Role</TableCellHeader></>}
            {tab==='hours-by-client'&&<TableCellHeader>Client</TableCellHeader>}
            {tab==='hours-by-campaign'&&<><TableCellHeader>Campaign</TableCellHeader><TableCellHeader>Client</TableCellHeader></>}
            <TableCellHeader>Total Hours</TableCellHeader>
            <TableCellHeader>Entries</TableCellHeader>
          </TableRow></TableHead>
          <TableBody>
            {loading&&<TableRow><TableCell colSpan={4} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>Loading...</TableCell></TableRow>}
            {!loading&&data.length===0&&<TableRow><TableCell colSpan={4} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>No data for selected filters.</TableCell></TableRow>}
            {data.map((row:any,i:number)=>(
              <TableRow key={i}>
                {tab==='hours-by-employee'&&<><TableCell style={{fontWeight:500}}>{row.name||row.user_name}</TableCell><TableCell style={{fontSize:12,color:'#6b7280'}}>{row.role}</TableCell></>}
                {tab==='hours-by-client'&&<TableCell style={{fontWeight:500}}>{row.name||row.client_name}</TableCell>}
                {tab==='hours-by-campaign'&&<><TableCell style={{fontWeight:500}}>{row.name||row.campaign_name}</TableCell><TableCell style={{fontSize:13}}>{row.client_name}</TableCell></>}
                <TableCell style={{fontWeight:700,color:'#2E6DA4'}}>{Number(row.total_hours||0).toFixed(1)}h</TableCell>
                <TableCell style={{color:'#6b7280'}}>{row.entry_count||0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length>0&&<TotalRow>Total: {totalHours.toFixed(1)} hours</TotalRow>}
      </Card>
    </div>
  );
};

export default ReportsPage;
