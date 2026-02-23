import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Button, Icon } from '@ssa-ui-kit/core';
import api from '../../api/client';

const PageHeader = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;`;
const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);`;
const NotifItem = styled.div<{unread:boolean}>`display:flex;align-items:flex-start;gap:14px;padding:16px 20px;border-bottom:1px solid #f3f4f6;background:${({unread})=>unread?'#f0f7ff':'#fff'};&:last-child{border-bottom:none;}`;
const NotifDot = styled.div<{unread:boolean}>`width:8px;height:8px;border-radius:50%;background:${({unread})=>unread?'#2E6DA4':'#d1d5db'};margin-top:6px;flex-shrink:0;`;
const NotifText = styled.div`font-size:14px;color:#374151;line-height:1.5;`;
const NotifTime = styled.div`font-size:11px;color:#9ca3af;margin-top:3px;`;
const EmptyState = styled.div`padding:48px;text-align:center;color:#9ca3af;font-size:14px;`;

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try { const r = await api.get('/notifications'); setNotifications(r.data.notifications||r.data||[]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markAllRead = async () => { await api.patch('/notifications/read-all').catch(()=>{}); fetchNotifs(); };
  const markRead = async (id:number) => { await api.patch(`/notifications/${id}/read`).catch(()=>{}); fetchNotifs(); };

  const unreadCount = notifications.filter((n:any)=>!n.is_read).length;

  return (
    <div>
      <PageHeader>
        <PageTitle>Notifications {unreadCount>0&&<span style={{fontSize:14,fontWeight:400,color:'#2E6DA4',marginLeft:8}}>({unreadCount} unread)</span>}</PageTitle>
        {unreadCount>0&&<Button variant="secondary" size="small" onClick={markAllRead}>Mark All Read</Button>}
      </PageHeader>
      <Card>
        {loading&&<EmptyState>Loading...</EmptyState>}
        {!loading&&notifications.length===0&&<EmptyState>No notifications yet.</EmptyState>}
        {notifications.map((n:any)=>(
          <NotifItem key={n.id} unread={!n.is_read} onClick={()=>!n.is_read&&markRead(n.id)} style={{cursor:!n.is_read?'pointer':'default'}}>
            <NotifDot unread={!n.is_read}/>
            <div>
              <NotifText>{n.message||n.title}</NotifText>
              <NotifTime>{new Date(n.created_at).toLocaleString()}</NotifTime>
            </div>
          </NotifItem>
        ))}
      </Card>
    </div>
  );
};

export default NotificationsPage;
