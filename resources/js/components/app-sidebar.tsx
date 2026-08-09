import { Link } from '@inertiajs/react';
import {
    Images,
    LayoutGrid,
    MonitorSmartphone,
    Settings2,
    Tags,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { home, install } from '@/routes';
import admin from '@/routes/admin';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: admin.dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Poses',
        href: admin.poses.index(),
        icon: Images,
    },
    {
        title: 'Categories',
        href: admin.categories.index(),
        icon: Tags,
    },
    {
        title: 'Group Sizes',
        href: admin.peopleCounts.index(),
        icon: Users,
    },
    {
        title: 'Settings',
        href: admin.settings.edit(),
        icon: Settings2,
    },
    {
        title: 'Devices',
        href: admin.devices.index(),
        icon: MonitorSmartphone,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Install Page',
        href: install(),
        icon: MonitorSmartphone,
    },
    {
        title: 'Booth Mode',
        href: home(),
        icon: Images,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={admin.dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
