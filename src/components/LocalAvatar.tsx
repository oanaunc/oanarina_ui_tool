import './local-profile.css';
import {useState} from 'react';
import {useLocalProfile} from '../local-profile';
import type {VersionAuthor} from '../local-profile';
export function ProfileAvatar({profile}:{profile:VersionAuthor}){const [failed,setFailed]=useState(''),initial=Array.from(profile.displayName.trim())[0]?.toUpperCase()??'O';return <span className="avatar local-avatar" aria-label={profile.displayName?'Local profile: '+profile.displayName:'Local profile'} title={profile.displayName||'Local profile'}>{profile.avatar&&failed!==profile.avatar?<img src={profile.avatar} alt="" onError={()=>setFailed(profile.avatar!)}/>:initial}</span>;}
export default function LocalAvatar(){const profile=useLocalProfile();return <ProfileAvatar profile={profile}/>;}
export function LocalProfileName(){const p=useLocalProfile();return <span className="local-profile-name">{p.displayName||'Local workspace'}</span>;}
