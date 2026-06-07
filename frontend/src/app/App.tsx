import type { ReactNode } from 'react'
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ScrollToTop } from './ScrollToTop'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { AdminActivityEventsPage } from '../pages/admin/AdminActivityEventsPage'
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminListsPage } from '../pages/admin/AdminListsPage'
import { AdminReviewsPage } from '../pages/admin/AdminReviewsPage'
import { AdminSystemEventsPage } from '../pages/admin/AdminSystemEventsPage'
import { AdminUserDetailsPage } from '../pages/admin/AdminUserDetailsPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { HomePage } from '../pages/HomePage'
import { CollectionDetailsPage } from '../pages/CollectionDetailsPage'
import { CompanyDetailsPage } from '../pages/CompanyDetailsPage'
import { LoginPage } from '../pages/LoginPage'
import { ListDetailsPage } from '../pages/ListDetailsPage'
import { MePage } from '../pages/MePage'
import { MovieDetailsPage } from '../pages/MovieDetailsPage'
import { MoviesSearchPage } from '../pages/MoviesSearchPage'
import { MyLibraryPage } from '../pages/MyLibraryPage'
import { MyListsPage } from '../pages/MyListsPage'
import { MyReviewsPage } from '../pages/MyReviewsPage'
import { PeopleSearchPage } from '../pages/PeopleSearchPage'
import { PersonDetailsPage } from '../pages/PersonDetailsPage'
import { KeywordDetailsPage } from '../pages/KeywordDetailsPage'
import { FeedPage } from '../pages/FeedPage'
import { FriendsPage } from '../pages/FriendsPage'
import { FriendRequestsPage } from '../pages/FriendRequestsPage'
import { DiscoverPage } from '../pages/DiscoverPage'
import { EpisodeDetailsPage } from '../pages/EpisodeDetailsPage'
import { PublicListDetailsPage } from '../pages/PublicListDetailsPage'
import { PublicListsPage } from '../pages/PublicListsPage'
import { PublicProfilePage } from '../pages/PublicProfilePage'
import { PublicReviewsPage } from '../pages/PublicReviewsPage'
import { RegisterPage } from '../pages/RegisterPage'
import { NetworkDetailsPage } from '../pages/NetworkDetailsPage'
import { SeasonDetailsPage } from '../pages/SeasonDetailsPage'
import { SeriesDetailsPage } from '../pages/SeriesDetailsPage'
import { SeriesSearchPage } from '../pages/SeriesSearchPage'
import { TmdbAccountPage } from '../pages/TmdbAccountPage'
import { TmdbCallbackPage } from '../pages/TmdbCallbackPage'
import { TmdbReviewDetailsPage } from '../pages/TmdbReviewDetailsPage'
import { UserProfilePage } from '../pages/UserProfilePage'

function withScroll(element: ReactNode) {
  return <ScrollToTop>{element}</ScrollToTop>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: withScroll(<HomePage />),
  },
  {
    path: '/login',
    element: withScroll(<LoginPage />),
  },
  {
    path: '/register',
    element: withScroll(<RegisterPage />),
  },
  {
    path: '/movies/search',
    element: withScroll(<MoviesSearchPage />),
  },
  {
    path: '/movies',
    element: withScroll(<Navigate to="/movies/search" replace />),
  },
  {
    path: '/movies/:tmdbId',
    element: withScroll(<MovieDetailsPage />),
  },
  {
    path: '/series/search',
    element: withScroll(<SeriesSearchPage />),
  },
  {
    path: '/series',
    element: withScroll(<Navigate to="/series/search" replace />),
  },
  {
    path: '/series/:tmdbId',
    element: withScroll(<SeriesDetailsPage />),
  },
  {
    path: '/series/:tmdbId/seasons/:seasonNumber',
    element: withScroll(<SeasonDetailsPage />),
  },
  {
    path: '/series/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber',
    element: withScroll(<EpisodeDetailsPage />),
  },
  {
    path: '/discover',
    element: withScroll(<DiscoverPage />),
  },
  {
    path: '/people/search',
    element: withScroll(<PeopleSearchPage />),
  },
  {
    path: '/people/:tmdbId',
    element: withScroll(<PersonDetailsPage />),
  },
  {
    path: '/collections/:collectionId',
    element: withScroll(<CollectionDetailsPage />),
  },
  {
    path: '/companies/:companyId',
    element: withScroll(<CompanyDetailsPage />),
  },
  {
    path: '/networks/:networkId',
    element: withScroll(<NetworkDetailsPage />),
  },
  {
    path: '/keywords/:keywordId',
    element: withScroll(<KeywordDetailsPage />),
  },
  {
    path: '/tmdb-reviews/:reviewId',
    element: withScroll(<TmdbReviewDetailsPage />),
  },
  {
    path: '/users/:username',
    element: withScroll(<UserProfilePage />),
  },
  {
    path: '/profiles/:username',
    element: withScroll(<PublicProfilePage />),
  },
  {
    path: '/lists/public',
    element: withScroll(<PublicListsPage />),
  },
  {
    path: '/lists/:id',
    element: withScroll(<PublicListDetailsPage />),
  },
  {
    path: '/reviews/public',
    element: withScroll(<PublicReviewsPage />),
  },
  {
    element: withScroll(<ProtectedRoute />),
    children: [
      {
        path: '/me',
        element: <MePage />,
      },
      {
        path: '/me/library',
        element: <MyLibraryPage />,
      },
      {
        path: '/me/reviews',
        element: <MyReviewsPage />,
      },
      {
        path: '/me/lists',
        element: <MyListsPage />,
      },
      {
        path: '/me/lists/:id',
        element: <ListDetailsPage />,
      },
      {
        path: '/me/tmdb',
        element: <TmdbAccountPage />,
      },
      {
        path: '/me/tmdb/callback',
        element: <TmdbCallbackPage />,
      },
      {
        path: '/feed',
        element: <FeedPage />,
      },
      {
        path: '/friends',
        element: <FriendsPage />,
      },
      {
        path: '/friends/requests',
        element: <FriendRequestsPage />,
      },
    ],
  },
  {
    element: withScroll(<ProtectedRoute requiredRole="Admin" />),
    children: [
      {
        path: '/admin',
        element: <AdminDashboardPage />,
      },
      {
        path: '/admin/users',
        element: <AdminUsersPage />,
      },
      {
        path: '/admin/users/:id',
        element: <AdminUserDetailsPage />,
      },
      {
        path: '/admin/reviews',
        element: <AdminReviewsPage />,
      },
      {
        path: '/admin/lists',
        element: <AdminListsPage />,
      },
      {
        path: '/admin/system-events',
        element: <AdminSystemEventsPage />,
      },
      {
        path: '/admin/activity-events',
        element: <AdminActivityEventsPage />,
      },
      {
        path: '/admin/audit-logs',
        element: <AdminAuditLogsPage />,
      },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
