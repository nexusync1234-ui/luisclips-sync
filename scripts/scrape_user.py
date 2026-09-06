import sys
import json
import re
import subprocess
import os
from datetime import datetime, timezone

# Ensure stdout and stderr use utf-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def scrape_profile(username):
    url = f"https://www.tiktok.com/@{username}"
    user_data = {
        "username": username,
        "nickname": username,
        "avatar": "",
        "bio": "",
        "followers": 0,
        "totalLikes": 0,
        "videoCount": 0,
        "secUid": "",
    }
    
    html = ""
    try:
        from curl_cffi import requests
        resp = requests.get(
            url,
            impersonate="chrome124",
            headers={"Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8"},
            timeout=12
        )
        if resp.status_code == 200:
            html = resp.text
    except Exception as err:
        sys.stderr.write(f"curl_cffi error for @{username}: {err}\n")

    if not html:
        try:
            import urllib.request
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8",
            }
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
        except Exception as e:
            sys.stderr.write(f"urllib error for @{username}: {e}\n")

    if html:
        try:
            m = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', html)
            if m:
                raw = json.loads(m.group(1))
                detail = raw.get("__DEFAULT_SCOPE__", {}).get("webapp.user-detail", {})
                info = detail.get("userInfo", {})
                u = info.get("user", {})
                st = info.get("stats", {})
                
                user_data["nickname"] = u.get("nickname") or username
                user_data["avatar"] = u.get("avatarLarger") or u.get("avatarMedium") or u.get("avatarThumb") or ""
                user_data["bio"] = u.get("signature") or ""
                user_data["followers"] = int(st.get("followerCount") or 0)
                user_data["totalLikes"] = int(st.get("heartCount") or 0)
                user_data["videoCount"] = int(st.get("videoCount") or 0)
                user_data["secUid"] = u.get("secUid") or ""
        except Exception as e:
            sys.stderr.write(f"Error parsing profile for @{username}: {e}\n")
        
    return user_data

def scrape_videos(username, limit=50):
    videos = []
    
    # Path to local yt-dlp in .venv (Windows or Linux) or system PATH
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    win_bin = os.path.join(base_dir, ".venv", "Scripts", "yt-dlp.exe")
    nix_bin = os.path.join(base_dir, ".venv", "bin", "yt-dlp")
    if os.path.exists(win_bin):
        ytdlp_bin = win_bin
    elif os.path.exists(nix_bin):
        ytdlp_bin = nix_bin
    else:
        ytdlp_bin = "yt-dlp"
        
    cmd = [
        ytdlp_bin,
        "--dump-json",
        "--flat-playlist",
        "--playlist-end", str(limit),
        "--no-warnings",
        f"https://www.tiktok.com/@{username}"
    ]
    
    now = datetime.now()
    current_year_month = f"{now.year}{now.month:02d}"
    
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
        for line in res.stdout.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
                vid_id = str(item.get("id") or "")
                if not vid_id:
                    continue
                    
                raw_upload_date = item.get("upload_date") or "" # Format: "YYYYMMDD"
                is_current_month = raw_upload_date.startswith(current_year_month) if raw_upload_date else True
                
                # Format to ISO string for standard compatibility
                if raw_upload_date and len(raw_upload_date) == 8:
                    try:
                        y = int(raw_upload_date[0:4])
                        m = int(raw_upload_date[4:6])
                        d = int(raw_upload_date[6:8])
                        upload_date = datetime(y, m, d, tzinfo=timezone.utc).isoformat()
                    except Exception:
                        upload_date = datetime.now(timezone.utc).isoformat()
                else:
                    upload_date = datetime.now(timezone.utc).isoformat()
                
                # Thumbnails
                thumbs = item.get("thumbnails") or []
                cover_url = ""
                if thumbs and isinstance(thumbs, list):
                    cover_url = thumbs[0].get("url") or ""
                    
                v = {
                    "id": vid_id,
                    "title": item.get("title") or item.get("description") or "Clip sem título",
                    "url": item.get("webpage_url") or f"https://www.tiktok.com/@{username}/video/{vid_id}",
                    "coverUrl": cover_url,
                    "viewCount": int(item.get("view_count") or 0),
                    "likeCount": int(item.get("like_count") or 0),
                    "commentCount": int(item.get("comment_count") or 0),
                    "repostCount": int(item.get("repost_count") or 0),
                    "duration": int(item.get("duration") or 0),
                    "uploadDate": upload_date,
                    "isCurrentMonth": is_current_month,
                }
                videos.append(v)
            except Exception as item_err:
                pass
    except Exception as e:
        sys.stderr.write(f"Error running yt-dlp: {e}\n")
        
    return videos

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No username provided"}))
        sys.exit(1)
        
    target_username = sys.argv[1].replace("@", "").strip()
    profile = scrape_profile(target_username)
    videos = scrape_videos(target_username)
    
    # Calculate monthly views and all-time tracked views strictly from real clips
    monthly_views = sum(v["viewCount"] for v in videos if v["isCurrentMonth"])
    all_time_views = sum(v["viewCount"] for v in videos)
        
    output = {
        "profile": profile,
        "videos": videos,
        "monthlyViews": monthly_views,
        "allTimeViews": all_time_views,
        "syncedAt": datetime.now(timezone.utc).isoformat()
    }
    
    print(json.dumps(output, ensure_ascii=False))
