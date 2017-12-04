## Generating SSL Certs using LetsEncrypt

1. Install letsencrypt on Ubuntu 16 LTS

2. Run `sudo /opt/letsencrypt/letsencrypt-auto certonly --standalone --email binura.g@platformer.com -d timesheet.platformer.com`

3. cp `cert.pem` and `privkey.pem` to projectRoot/nginx

