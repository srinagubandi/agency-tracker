import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '../../components/ui';
import api from '../../api/client';

const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 24px;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const RoleBadge = styled('span', { shouldForwardProp: (prop) => prop !== 'role' })<{role:string}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({role})=>role==='manager'?'#e0f2fe':'#dcfce7'};color:${({role})=>role==='manager'?'#0284c7':'#16a34a'};`;

const PortalTeam: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/users').then(r=>setUsers((r.data.users||r.data||[]).filter((u:any)=>u.role!=='client'))).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  return (
    <div>
      <PageTitle>Our Team</PageTitle>
      <Card>
        <Table>
          <TableHead><TableRow><TableCellHeader>Name</TableCellHeader><TableCellHeader>Role</TableCellHeader><TableCellHeader>Email</TableCellHeader></TableRow></TableHead>
          <TableBody>
            {loading&&<TableRow><TableCell colSpan={3} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>Loading...</TableCell></TableRow>}
            {users.map((u:any)=>(
              <TableRow key={u.id}>
                <TableCell style={{fontWeight:500}}>{u.name||'—'}</TableCell>
                <TableCell><RoleBadge role={u.role}>{u.role?.replace('_',' ')}</RoleBadge></TableCell>
                <TableCell style={{fontSize:13}}>{u.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default PortalTeam;
