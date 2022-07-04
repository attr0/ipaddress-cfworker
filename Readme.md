# **[IP Address-CFworker](https://github.com/ohh-haolin/ipaddress-cfworker)**

Get your public IP address information.


## Access
### Web

Use your browser to visit: https://ip.hlz.ink

![](/img/screenshot.png)



### Console

Use `curl` to get your ip infomration on a headless machine

```bash
curl ip.hlz.ink
```

More detail? (Use [ipinfo.io](https://ipinfo.io) database) 

```bash
curl ip.hlz.ink/json

# equal to
curl ip.hlz.ink/json/ipinfo
```

Also, you can use cloudflare database

```bash
curl ip.hlz.ink/json/cf
```

In addition, you can ask for the information of a given ip by

```bash
curl ip.hlz.ink/query/{ip_address}
```

## How to deploy your own one

To-Do

## Thanks

![cloudflare-worker](img/cloudflare-worker.png)

![ipinfo](img/ipinfo.png)