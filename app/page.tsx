import CloudStudio from './cloud-studio';
import { cloudConfigured } from '@/lib/cloud';
export const dynamic = 'force-dynamic';
export default function Home() { return <CloudStudio configured={cloudConfigured()}/>; }
