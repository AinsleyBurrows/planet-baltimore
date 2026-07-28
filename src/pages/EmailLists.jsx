import React from 'react';
import { Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailListsTab from '@/components/email/EmailListsTab';
import EmailCampaignsTab from '@/components/email/EmailCampaignsTab';

export default function EmailLists() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl px-6 py-8 border-2 border-[#d4580a]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#d4580a]/10 border border-[#d4580a]/40 flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#d4580a]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ticketing Outreach</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Email Lists</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your contacts and send branded invitation emails that link straight to your RSVP or ticket page.</p>
      </div>

      <Tabs defaultValue="lists">
        <TabsList className="bg-secondary/50 border border-border rounded-2xl grid grid-cols-2 h-auto gap-1 p-1.5">
          <TabsTrigger value="lists" className="rounded-xl py-2.5">Lists</TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-xl py-2.5">Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="lists" className="mt-5"><EmailListsTab /></TabsContent>
        <TabsContent value="campaigns" className="mt-5"><EmailCampaignsTab /></TabsContent>
      </Tabs>
    </div>
  );
}