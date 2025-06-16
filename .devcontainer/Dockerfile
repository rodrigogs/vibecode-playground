FROM node:22-bookworm

# Install additional system dependencies and set up sudo
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        # Build tools for native modules
        build-essential \
        python3-dev \
        # Additional utilities
        curl \
        wget \
        unzip \
        # For better terminal experience
        git \
        vim \
        nano \
        sudo \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* \
    && echo 'node ALL=(root) NOPASSWD:ALL' > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node \
    && usermod -aG sudo node

USER node

WORKDIR /workspaces
