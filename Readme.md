# **[iP address-CFworker](https://github.com/ohh-haolin/ipaddress-cfworker)**

Get your public IP address easily and quickly.

**You are not allowed to use it for commercial purpose!**



## Web Page

Visit  https://ip.hlz.ink

![](/img/screenshot.png)



## Console

 Just type

```bash
curl ip.hlz.ink
```

Want more detail?

```
curl ip.hlz.ink/json
```

Want more more detail?

```
curl ip.hlz.ink/jsonall
```

Also, it could get information of a specific IP. Type

```
curl ip.hlz.ink/ip/{ip_address}
```



## IP Database

Depend on request

1. `/json`

   [Cloudflare](https://workers.cloudflare.com/) Free Database

2. `/jsonall` or `/ip/{ip_address}`

   Combination of [ipinsight.io](https://ipinsight.io/) and [ipinfo.io](https://ipinfo.io/)

   

## Deploy your own API

1. Create a Cloudflare account and create a worker
2. Paste the `index.js` into your worker and change the ASSET_URL  to your one  (you could create a fork of this project and use GitHub page)
3. Create two accounts on ipinfo.io and ipinsight.io. Copy the token to worker environment variables
   - ipinfo_token
   - ipinsight_token

**Boom** it settles down!



# Thanks

![cloudflare-worker](img/cloudflare-worker.png)

![ipinsight](img/ipinsight.png)

![ipinfo](img/ipinfo.png)