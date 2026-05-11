import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';

// Eagerly load Home for instant first paint
import Home from '@/pages/Home';

// Lazy-load all other pages — each loads only when first visited
const Discover                    = lazy(() => import('@/pages/Discover'));
const Neighborhoods               = lazy(() => import('@/pages/Neighborhoods'));
const OrderConfirmation           = lazy(() => import('@/pages/OrderConfirmation'));
const Communities                 = lazy(() => import('@/pages/Communities'));
const CommunityDetail             = lazy(() => import('@/pages/CommunityDetail'));
const Artists                     = lazy(() => import('@/pages/Artists'));
const ArtistDetail                = lazy(() => import('@/pages/ArtistDetail'));
const Businesses                  = lazy(() => import('@/pages/Businesses'));
const BusinessDetail              = lazy(() => import('@/pages/BusinessDetail'));
const ArtsOrganizations           = lazy(() => import('@/pages/ArtsOrganizations'));
const ArtsOrgDetail               = lazy(() => import('@/pages/ArtsOrgDetail'));
const CreateArtsOrg               = lazy(() => import('@/pages/CreateArtsOrg'));
const CommunityAssociations       = lazy(() => import('@/pages/CommunityAssociations'));
const CommunityAssociationDetail  = lazy(() => import('@/pages/CommunityAssociationDetail'));
const CreateCommunityAssociation  = lazy(() => import('@/pages/CreateCommunityAssociation'));
const NotificationSettings        = lazy(() => import('@/pages/NotificationSettings'));
const OrganizerStudio             = lazy(() => import('@/pages/OrganizerStudio'));
const TicketingHub                = lazy(() => import('@/pages/TicketingHub'));
const EventTicketingPage          = lazy(() => import('@/pages/EventTicketing'));
const PromoterDashboard           = lazy(() => import('@/pages/PromoterDashboard'));
const TicketSalesDashboard        = lazy(() => import('@/pages/TicketSalesDashboard'));
const CommunityCalendar           = lazy(() => import('@/pages/CommunityCalendar'));
const Profile                     = lazy(() => import('@/pages/Profile'));
const Messages                    = lazy(() => import('@/pages/Messages'));
const Notifications               = lazy(() => import('@/pages/Notifications'));
const CreatePost                  = lazy(() => import('@/pages/CreatePost'));
const CreateEvent                 = lazy(() => import('@/pages/CreateEvent'));
const CreateCommunity             = lazy(() => import('@/pages/CreateCommunity'));
const CreateArtist                = lazy(() => import('@/pages/CreateArtist'));
const CreateBusiness              = lazy(() => import('@/pages/CreateBusiness'));
const Stories                     = lazy(() => import('@/pages/Stories'));
const Search                      = lazy(() => import('@/pages/Search'));
const StoryDetail                 = lazy(() => import('@/pages/StoryDetail'));
const CreateStory                 = lazy(() => import('@/pages/CreateStory'));
const EventDetail                 = lazy(() => import('@/pages/EventDetail'));
const BannerPreview               = lazy(() => import('@/pages/BannerPreview'));

// Minimal fallback shown while a lazy page chunk is downloading
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-7 h-7 border-2 border-muted border-t-accent rounded-full animate-spin" />
    </div>
  );
}

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
          <div className="w-8 h-8 border-2 border-muted border-t-accent rounded-full animate-spin mx-auto"></div>
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
    <Suspense fallback={<PageLoader />}>
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
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/banner-preview" element={<BannerPreview />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App