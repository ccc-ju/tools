
import urllib.request
import json

def check_ip(ip):
    url = f"https://ipwho.is/{ip}"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            print(f"--- Data for {ip} ---")
            print(json.dumps(data, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error fetching {ip}: {e}")

check_ip("125.121.61.164")
check_ip("8.8.8.8") # Google DNS for comparison
