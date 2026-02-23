import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '../../components/ui';
import api from '../../api/client';

const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 24px;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const StatusBadge = styled('span', { shouldForwardProp: (prop) => prop !== 'active' })<{active:boolean}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({active})=>active?'#dcfce7':'#f3f4f6'};color:${({active})=>active?'#16a34a':'#6b7280'};`;

const PortalCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/campaigns').then(r=>setCampaigns(r.data.campaigns||r.data||[])).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  return (
    <div>
      <PageTitle>Campaigns</PageTitle>
      <Card>
        <Table>
          <TableHead><TableRow><TableCellHeader>Campaign</TableCellHeader><TableCellHeader>Type</TableCellHeader><TableCellHeader>Status</TableCellHeader><TableCellHeader>Start Date</TableCellHeader></TableRow></TableHead>
          <TableBody>
            {loading&&<TableRow><TableCell colSpan={4} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>Loading...</TableCell></TableRow>}
            {campaigns.map((c:any)=>(
              <TableRow key={c.id}>
                <TableCell style={{fontWeight:500}}>{c.name}</TableCell>
                <TableCell style={{fontSize:13}}>{c.type||'—'}</TableCell>
                <TableCell><StatusBadge active={c.status==='active'}>{c.status}</StatusBadge></TableCell>
                <TableCell style={{fontSize:13,color:'#6b7280'}}>{c.start_date?new Date(c.start_date).toLocaleDateString():'—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default PortalCampaigns;
