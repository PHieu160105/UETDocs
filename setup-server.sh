#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/uetdocs"
DEPLOY_USER="deploy"
DEPLOY_KEY_PATH="/home/${DEPLOY_USER}/.ssh/github_actions"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root or with sudo."
  exit 1
fi

. /etc/os-release
if [[ "${ID}" != "ubuntu" ]]; then
  echo "This script is intended for Ubuntu."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/5] Install base packages"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git lsb-release ufw

echo "[2/5] Create deploy user"
if ! id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
  usermod -aG sudo "${DEPLOY_USER}"
fi

install -d -m 700 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
if [[ -f /root/.ssh/authorized_keys && ! -f /home/${DEPLOY_USER}/.ssh/authorized_keys ]]; then
  install -m 600 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" \
    /root/.ssh/authorized_keys "/home/${DEPLOY_USER}/.ssh/authorized_keys"
fi

echo "[3/5] Install Docker Engine + Compose plugin"
install -d -m 0755 /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
usermod -aG docker "${DEPLOY_USER}"

echo "[4/5] Configure firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "[5/5] Prepare app dir and GitHub Actions SSH key"
install -d -m 0755 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "${APP_DIR}"

if [[ ! -f "${DEPLOY_KEY_PATH}" ]]; then
  runuser -u "${DEPLOY_USER}" -- ssh-keygen \
    -t ed25519 \
    -f "${DEPLOY_KEY_PATH}" \
    -N "" \
    -C "github-actions-deploy@$(hostname)"
fi

PUB_KEY="$(cat "${DEPLOY_KEY_PATH}.pub")"
AUTH_KEYS="/home/${DEPLOY_USER}/.ssh/authorized_keys"
touch "${AUTH_KEYS}"
grep -qxF "${PUB_KEY}" "${AUTH_KEYS}" || echo "${PUB_KEY}" >> "${AUTH_KEYS}"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "${AUTH_KEYS}"
chmod 600 "${AUTH_KEYS}"

echo
echo "Bootstrap complete."
echo "Deploy user: ${DEPLOY_USER}"
echo "App dir: ${APP_DIR}"
echo
echo "Next commands on the server:"
echo "  sudo cat ${DEPLOY_KEY_PATH}          # paste into GitHub secret DROPLET_SSH_KEY"
echo "  sudo cat ${DEPLOY_KEY_PATH}.pub      # optional verification"
echo "  sudo -iu ${DEPLOY_USER}"
echo "  git clone <YOUR_REPO_URL> ${APP_DIR}"