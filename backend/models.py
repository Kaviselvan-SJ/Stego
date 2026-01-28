# model.py
import torch
import torch.nn as nn

class DenseEncoder(nn.Module):
    def __init__(self, data_depth=1, hidden_size=32):
        super(DenseEncoder, self).__init__()
        self.conv1 = nn.Sequential(
            nn.Conv2d(3, hidden_size, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.BatchNorm2d(hidden_size)
        )
        self.conv2 = nn.Sequential(
            nn.Conv2d(hidden_size + data_depth, hidden_size, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.BatchNorm2d(hidden_size)
        )
        self.conv3 = nn.Sequential(
            nn.Conv2d(hidden_size + data_depth + hidden_size, hidden_size, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.BatchNorm2d(hidden_size)
        )
        self.conv4 = nn.Sequential(
            nn.Conv2d(hidden_size * 2 + data_depth + hidden_size, 3, kernel_size=3, padding=1)
        )

    def forward(self, cover, payload):
        x1 = self.conv1(cover)
        
        # Layer 1 concat
        cat1 = torch.cat([x1, payload], dim=1)
        x2 = self.conv2(cat1)
        
        # FIXED: Reverted order to [x2, cat1]
        cat2 = torch.cat([x2, cat1], dim=1) 
        x3 = self.conv3(cat2)
        
        # FIXED: Reverted order to [x3, cat2]
        cat3 = torch.cat([x3, cat2], dim=1)
        x4 = self.conv4(cat3)
        
        return x4

class DenseDecoder(nn.Module):
    def __init__(self, data_depth=1, hidden_size=32):
        super(DenseDecoder, self).__init__()
        self.conv1 = nn.Sequential(
            nn.Conv2d(3, hidden_size, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.BatchNorm2d(hidden_size)
        )
        self.conv2 = nn.Sequential(
            nn.Conv2d(hidden_size, hidden_size, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.BatchNorm2d(hidden_size)
        )
        self.conv3 = nn.Sequential(
            nn.Conv2d(hidden_size * 2, hidden_size, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.BatchNorm2d(hidden_size)
        )
        self.conv4 = nn.Sequential(
            nn.Conv2d(hidden_size * 3, data_depth, kernel_size=3, padding=1)
        )

    def forward(self, image):
        x1 = self.conv1(image)
        x2 = self.conv2(x1)
        
        # FIXED: Reverted order to [x2, x1]
        cat2 = torch.cat([x2, x1], dim=1)
        x3 = self.conv3(cat2)
        
        # FIXED: Reverted order to [x3, cat2]
        cat3 = torch.cat([x3, cat2], dim=1)
        x4 = self.conv4(cat3)
        
        return x4