import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '@ssa-ui-kit/core';
import api from '../../api/client';

const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 24px;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const ActionBadge = styled.span<{action:string}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({action})=>action==='created'?'#dcfce7':action==='updated'?'#fef3c7':action==='deleted'?'#fee2e2':'#dbeafe'};color:${({action})=>action==='created'?'#16a34a':action==='updated'?'#d97706':action==='deleted'?'#dc2626':'#2563eb'};`;
const FilterBar = styled.div`display:flex;gap:12px;margin-bottom:16px;`;
const StyledSelect = styled.select`padding:8px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;background:#fff;&:focus{border-color:#2E6DA4;}`;

const ChangeLogPage: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/change-log').then(r=>setEntries(r.data.entries||r.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = filter ? entries.filter(e=>e.action===filter) : entries;

  return (
    <div>
      <PageTitle>Change Log</PageTitle>
      <FilterBar>
        <StyledSelect value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </StyledSelect>
      </FilterBar>
      <Card>
        <Table>
          <TableHead><TableRow>
            <TableCellHeader>Action</TableCellHeader>
            <TableCellHeader>Entity</TableCellHeader>
            <TableCellHeader>Name</TableCellHeader>
            <TableCellHeader>By</TableCellHeader>
            <TableCellHeader>When</TableCellHeader>
            <TableCellHeader>Notes</TableCellHeader>
          </TableRow></TableHead>
          <TableBody>
            {loading&&<TableRow><TableCell colSpan={6} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>Loading...</TableCell></TableRow>}
            {!loading&&filtered.length===0&&<TableRow><TableCell colSpan={6} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>No entries found.</TableCell></TableRow>}
            {filtered.map((e:any,i:number)=>(
              <TableRow key={e.id||i}>
                <TableCell><ActionBadge action={e.action}>{e.action}</ActionBadge></TableCell>
                <TableCell style={{fontSize:13,color:'#6b7280'}}>{e.entity_type?.replace(/_/g,' ')}</TableCell>
                <TableCell style={{fontWeight:500,fontSize:13}}>{e.entity_name||'—'}</TableCell>
                <TableCell style={{fontSize:13}}>{e.user_name||'System'}</TableCell>
                <TableCell style={{fontSize:12,color:'#9ca3af'}}>{new Date(e.created_at).toLocaleString()}</TableCell>
                <TableCell style={{fontSize:12,color:'#6b7280',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.notes||'—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ChangeLogPage;
