import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConversationSidebar from '@/components/messages/ConversationSidebar';
import ChatWindow from '@/components/messages/ChatWindow';
import NewConversationModal from '@/components/messages/NewConversationModal';
import BroadcastModal from '@/components/messages/BroadcastModal';

// Build a stable conversation_id from two user IDs
function makeConvoId(a, b) {
  return [a, b].sort().join('__');
}

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeConvo, setActiveConvo] = useState(null);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showChat, setShowChat] = useState(false); // mobile toggle

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
    refetchInterval: 5000,
    enabled: !!currentUser,
  });

  // Derive conversations from messages where current user is sender or recipient
  const conversations = useMemo(() => {
    if (!currentUser) return [];
    const myMessages = allMessages.filter(
      m => m.sender_id === currentUser.id || m.recipient_id === currentUser.id
    );

    const convoMap = {};
    myMessages.forEach(msg => {
      const cid = msg.conversation_id;
      if (!convoMap[cid]) {
        const isOwn = msg.sender_id === currentUser.id;
        convoMap[cid] = {
          conversation_id: cid,
          other: {
            id: isOwn ? msg.recipient_id : msg.sender_id,
            name: isOwn ? msg.recipient_name : msg.sender_name,
            avatar: isOwn ? msg.recipient_avatar : msg.sender_avatar,
            type: isOwn ? msg.recipient_type : 'user',
          },
          lastMessage: msg,
          unreadCount: 0,
        };
      }
      // Count unread messages (sent to me, not read)
      if (msg.recipient_id === currentUser.id && !msg.is_read) {
        convoMap[cid].unreadCount = (convoMap[cid].unreadCount || 0) + 1;
      }
      // Keep the most recent as lastMessage (list is -created_date so first is newest)
      if (!convoMap[cid].lastMessage || new Date(msg.created_date) > new Date(convoMap[cid].lastMessage.created_date)) {
        convoMap[cid].lastMessage = msg;
      }
    });

    return Object.values(convoMap)
      .filter(c => c.other.name?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.lastMessage?.created_date) - new Date(a.lastMessage?.created_date));
  }, [allMessages, currentUser, search]);

  // Messages for active conversation
  const activeMessages = useMemo(() => {
    if (!activeConvo) return [];
    return allMessages
      .filter(m => m.conversation_id === activeConvo.conversation_id)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [allMessages, activeConvo]);

  const handleSelectConvo = (convo) => {
    setActiveConvo(convo);
    setShowChat(true);
  };

  const handleNewConvo = (person) => {
    if (!currentUser) return;
    const cid = makeConvoId(currentUser.id, `${person.type}__${person.id}`);
    const convo = {
      conversation_id: cid,
      other: person,
      lastMessage: null,
      unreadCount: 0,
    };
    setActiveConvo(convo);
    setShowChat(true);
    setShowNew(false);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden border border-border bg-card shadow-sm -mx-4 md:mx-0">
      {/* Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col ${showChat ? 'hidden md:flex' : 'flex'}`}>
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConvo?.conversation_id}
          onSelect={handleSelectConvo}
          currentUserId={currentUser.id}
          search={search}
          onSearch={setSearch}
        />
        {/* New Message / Broadcast Buttons */}
        <div className="p-3 border-t border-border bg-card space-y-2">
          <Button
            onClick={() => setShowNew(true)}
            className="w-full gap-2 rounded-xl" style={{ backgroundColor: '#d4580a', color: 'white' }}
          >
            <Plus className="w-4 h-4" /> New Message
          </Button>
          <Button
            onClick={() => setShowBroadcast(true)}
            variant="outline"
            className="w-full gap-2 rounded-xl"
          >
            <Users className="w-4 h-4" /> Message All Followers
          </Button>
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${!showChat ? 'hidden md:flex' : 'flex'} flex-col`}>
        {activeConvo ? (
          <ChatWindow
            conversation={activeConvo}
            messages={activeMessages}
            currentUser={currentUser}
            onBack={() => setShowChat(false)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-secondary/20">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Select a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Choose from your existing conversations or start a new one with an artist or arts organization.
            </p>
            <Button onClick={() => setShowNew(true)} className="mt-5 gap-2 rounded-xl" style={{ backgroundColor: '#d4580a', color: 'white' }}>
              <Plus className="w-4 h-4" /> Start a Conversation
            </Button>
          </div>
        )}
      </div>

      {showNew && (
        <NewConversationModal
          onSelect={handleNewConvo}
          onClose={() => setShowNew(false)}
          currentUserId={currentUser.id}
        />
      )}

      {showBroadcast && (
        <BroadcastModal
          currentUser={currentUser}
          onClose={() => setShowBroadcast(false)}
        />
      )}
    </div>
  );
}