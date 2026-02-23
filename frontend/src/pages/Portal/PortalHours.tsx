import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '@ssa-ui-kit/core';
import api from '../../api/client';

const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 24px;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const StatusBadge = styled.span<{status:string}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({status})=>status==='approved'?'#dcfce7':status==='rejected'?'#fee2e2':'#fef3c7'};color:${({status})=>status==='approved'?'#16a34a':status==='rejected'?'#dc2626':'#d97706'};`;

const PortalHours: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/time-entries').then(r=>setEntries(r.data.entries||r.data||[])).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  return (
    <div>
      <PageTitle>Hours Logged</PageTitle>
      <Card>
        <Table>
          <TableHead><TableRow><TableCellHeader>Employee</TableCellHeader><TableCellHeader>Campaign</TableCellHeader><TableCellHeader>Hours</TableCellHeader><TableCellHeader>Date</TableCellHeader><TableCellHeader>Status</TableCellHeader></TableRow></TableHead>
          <TableBody>
            {loading&&<TableRow><TableCell colSpan={5} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>Loading...</TableCell></TableRow>}
            {entries.map((e:any)=>(
              <TableRow key={e.id}>
                <TableCell>{e.user_name}</TableCell>
                <TableCell>{e.campaign_name||'—'}</TableCell>
                <TableCell style={{fontWeight:600,color:'#2E6DA4'}}>{e.hours}h</TableCell>
                <TableCell style={{fontSize:13,color:'#6b7280'}}>{new Date(e.date).toLocaleDateString()}</TableCell>
                <TableCell><StatusBadge status={e.status}>{e.status}</StatusBadge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default PortalHours;
