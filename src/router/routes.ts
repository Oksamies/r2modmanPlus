import { RouteRecordRaw } from 'vue-router';
import Profile from '../model/Profile';
import ManagerInformation from '../_managerinf/ManagerInformation';

const appTitle = () => `${ManagerInformation.APP_NAME} (${ManagerInformation.VERSION.toString()})`;
const profileTitle = () => `${appTitle()} - ${Profile.getActiveProfile().getProfileName()}`;

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('components/navigation/NavigationLayout.vue'),
        meta: {title: appTitle},
        children: [
            {
                name: 'index',
                path: '',
                component: () => import("pages/GameSelectionScreen.vue"),
                meta: {title: appTitle}
            },
            {
                name: 'splash',
                path: 'splash/',
                component: () => import('pages/Splash.vue'),
                meta: {title: appTitle}
            },
            {
                name: 'linux',
                path: 'linux-native-game-setup/',
                component: () => import('pages/LinuxNativeGameSetup.vue'),
                meta: {
                    title: () => ManagerInformation.APP_NAME
                }
            },
            {
                name: 'profiles',
                path: 'profiles/',
                component: () => import('pages/Profiles.vue'),
                meta: {title: appTitle}
            },
            {
                name: 'manager',
                path: 'manager/',
                component: () => import('pages/Manager.vue'),
                meta: {title: () => profileTitle()},
                children: [
                    {
                        name: 'manager.dashboard',
                        path: 'dashboard/',
                        components: {
                            subview: () => import('components/views/GameDashboard.vue')
                        },
                        meta: {title: () => profileTitle()}
                    },
                    {
                        name: 'manager.installed',
                        path: 'installed/',
                        alias: '',
                        components: {
                            subview: () => import('components/views/InstalledModView.vue')
                        },
                        meta: {title: () => profileTitle()}
                    },
                    {
                        name: 'manager.online',
                        path: 'online/',
                        components: {
                            subview: () => import('components/views/OnlineModView.vue')
                        },
                        meta: {title: () => profileTitle()}
                    },
                    {
                        name: 'manager.settings',
                        path: 'settings/',
                        components: {
                            subview: () => import('components/settings-components/SettingsView.vue')
                        },
                        meta: {title: () => profileTitle()}
                    },
                    {
                        name: 'manager.mod_details',
                        path: 'mod/:community/:namespace/:package',
                        redirect: { name: 'manager.mod_details.details' },
                        components: {
                            subview: () => import('components/views/ModDetailsView.vue')
                        },
                        meta: {title: () => profileTitle()},
                        children: [
                            {
                                name: 'manager.mod_details.details',
                                path: '',
                                component: () => import('components/views/mod-details/ModReadme.vue'),
                                meta: {title: () => profileTitle()}
                            },
                            {
                                name: 'manager.mod_details.required',
                                path: 'required',
                                component: () => import('components/views/mod-details/ModRequired.vue'),
                                meta: {title: () => profileTitle()}
                            },
                            {
                                name: 'manager.mod_details.wiki',
                                path: 'wiki',
                                component: () => import('components/views/mod-details/ModWiki.vue'),
                                meta: {title: () => profileTitle()}
                            },
                            {
                                name: 'manager.mod_details.changelog',
                                path: 'changelog',
                                component: () => import('components/views/mod-details/ModChangelog.vue'),
                                meta: {title: () => profileTitle()}
                            },
                            {
                                name: 'manager.mod_details.versions',
                                path: 'versions',
                                component: () => import('components/views/mod-details/ModVersions.vue'),
                                meta: {title: () => profileTitle()}
                            }
                        ]
                    }
                ]
            },
            {
                name: 'config-editor',
                path: 'config-editor/',
                component: () => import('pages/ConfigEditor.vue'),
                meta: {title: () => profileTitle()}
            },
            {
                name: 'help',
                path: 'help/',
                component: () => import('pages/Help.vue'),
                meta: {title: () => profileTitle()}
            },
            {
                name: 'downloads',
                path: 'downloads/',
                component: () => import('pages/DownloadMonitor.vue'),
                meta: {title: () => profileTitle()}
            }
        ]
    }
];

export default routes;
