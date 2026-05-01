import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Discover from '@/pages/Discover';

import Communities from '@/pages/Communities';
import Artists from '@/pages/Artists';
import Businesses from '@/pages/Businesses';
import Profile from '@/pages/Profile';
import Messages from '@/pages/Messages';
import Notifications from '@/pages/Notifications';
import CreatePost from '@/pages/CreatePost';
import CreateEvent from '@/pages/CreateEvent';
import CreateCommunity from '@/pages/CreateCommunity';
import CreateArtist from '@/pages/CreateArtist';
import CreateBusiness from '@/pages/CreateBusiness';
import Stories from '@/pages/Stories';
import Search from '@/pages/Search';
import StoryDetail from '@/pages/StoryDetail';
import CreateStory from '@/pages/CreateStory';
import Neighborhoods from '@/pages/Neighborhoods';
import CommunityDetail from '@/pages/CommunityDetail';
import ArtistDetail from '@/pages/ArtistDetail';
import BusinessDetail from '@/pages/BusinessDetail';
import ArtsOrganizations from '@/pages/ArtsOrganizations';
import ArtsOrgDetail from '@/pages/ArtsOrgDetail';
import CreateArtsOrg from '@/pages/CreateArtsOrg';
import CommunityAssociations from '@/pages/CommunityAssociations';
import CommunityAssociationDetail from '@/pages/CommunityAssociationDetail';
import CreateCommunityAssociation from '@/pages/CreateCommunityAssociation';
import NotificationSettings from '@/pages/NotificationSettings';
import OrganizerStudio from '@/pages/OrganizerStudio';
import TicketingHub from '@/pages/TicketingHub';
import EventTicketingPage from '@/pages/EventTicketing';
import PromoterDashboard from '@/pages/PromoterDashboard';
import OrderConfirmation from '@/pages/OrderConfirmation';
import TicketSalesDashboard from '@/pages/TicketSalesDashboard';
import CommunityCalendar from '@/pages/CommunityCalendar';
import Marketplace from '@/pages/Marketplace';
import MarketplaceDetail from '@/pages/MarketplaceDetail';
import MarketplaceConfirmation from '@/pages/MarketplaceConfirmation';
import MarketplaceSell from '@/pages/MarketplaceSell';

// Routes already exist in App.jsx - verify they're present

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-accent">Planet</span>
            <span className="text-2xl font-light text-foreground">Baltimore</span>
          </div>
          <div className="w-8 h-8 border-3 border-muted border-t-accent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/neighborhoods" element={<Neighborhoods />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/communities/:id" element={<CommunityDetail />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/:id" element={<ArtistDetail />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route path="/businesses/:id" element={<BusinessDetail />} />
        <Route path="/arts-organizations" element={<ArtsOrganizations />} />
        <Route path="/arts-organizations/:id" element={<ArtsOrgDetail />} />
        <Route path="/create-arts-org" element={<CreateArtsOrg />} />
        <Route path="/community-associations" element={<CommunityAssociations />} />
        <Route path="/community-associations/:id" element={<CommunityAssociationDetail />} />
        <Route path="/create-community-association" element={<CreateCommunityAssociation />} />
        <Route path="/notification-settings" element={<NotificationSettings />} />
        <Route path="/organizer-studio" element={<OrganizerStudio />} />
        <Route path="/ticketing" element={<TicketingHub />} />
        <Route path="/events/:id/tickets" element={<EventTicketingPage />} />
        <Route path="/promoter-dashboard" element={<PromoterDashboard />} />
        <Route path="/ticket-sales-dashboard" element={<TicketSalesDashboard />} />
        <Route path="/community-calendar" element={<CommunityCalendar />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/sell" element={<MarketplaceSell />} />
        <Route path="/marketplace/confirmation" element={<MarketplaceConfirmation />} />
        <Route path="/marketplace/:id" element={<MarketplaceDetail />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/create-community" element={<CreateCommunity />} />
        <Route path="/create-artist" element={<CreateArtist />} />
        <Route path="/create-business" element={<CreateBusiness />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/search" element={<Search />} />
        <Route path="/stories/:id" element={<StoryDetail />} />
        <Route path="/create-story" element={<CreateStory />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App