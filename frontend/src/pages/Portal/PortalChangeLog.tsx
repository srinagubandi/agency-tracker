import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '../../components/ui';
import api from '../../api/client';

const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 24px;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const ActionBadge = styled.span<{action:string}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({action})=>action==='created'?'#dcfce7':action==='updated'?'#fef3c7':action==='deleted'?'#fee2e2':'#dbeafe'};color:${({action})=>action==='created'?'#16a34a':action==='updated'?'#d97706':action==='deleted'?'#dc2626':'#2563eb'};`;

const PortalChangeLog: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/change-log').then(r=>setEntries(r.data.entries||r.data||[])).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  return (
    <div>
      <PageTitle>Change Log</PageTitle>
      <Card>
        <Table>
          <TableHead><TableRow><TableCellHeader>Action</TableCellHeader><TableCellHeader>Item</TableCellHeader><TableCellHeader>By</TableCellHeader><TableCellHeader>When</TableCellHeader></TableRow></TableHead>
          <TableBody>
            {loading&&<TableRow><TableCell colSpan={4} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>Loading...</TableCell></TableRow>}
            {entries.map((e:any,i:number)=>(
              <TableRow key={e.id||i}>
                <TableCell><ActionBadge action={e.action}>{e.action}</ActionBadge></TableCell>
                <TableCell style={{fontSize:13}}>{e.entity_name||'—'}</TableCell>
                <TableCell style={{fontSize:13}}>{e.user_name||'System'}</TableCell>
                <TableCell style={{fontSize:12,color:'#9ca3af'}}>{new Date(e.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default PortalChangeLog;
