import heapq
import math
from typing import List, Tuple, Dict, Set

class AStarGridRouter:
    def __init__(self, width: int = 15, height: int = 15):
        self.width = width
        self.height = height

    def heuristic(self, a: Tuple[int, int], b: Tuple[int, int]) -> float:
        """Euclidean distance heuristic."""
        return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)

    def get_neighbors(self, node: Tuple[int, int]) -> List[Tuple[int, int]]:
        x, y = node
        neighbors = []
        # Support 8-way movement (up, down, left, right, diagonals)
        directions = [
            (-1, 0), (1, 0), (0, -1), (0, 1),
            (-1, -1), (-1, 1), (1, -1), (1, 1)
        ]
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.width and 0 <= ny < self.height:
                neighbors.append((nx, ny))
        return neighbors

    def get_step_cost(self, current: Tuple[int, int], neighbor: Tuple[int, int], 
                      obstacles: Set[Tuple[int, int]], 
                      terrain_types: Dict[Tuple[int, int], float],
                      enemy_threats: Dict[Tuple[int, int], float]) -> float:
        """
        Calculates cost to transition from current to neighbor.
        If neighbor is an obstacle, cost is infinity.
        Otherwise, cost is:
           base_step_cost (1 for straight, 1.414 for diagonal)
           + terrain_cost (from terrain_types map, defaults to 0)
           + threat_cost (from enemy_threats map, scaled by proximity & intensity)
        """
        if neighbor in obstacles:
            return float('inf')

        # Distance cost (straight vs diagonal)
        dx = abs(current[0] - neighbor[0])
        dy = abs(current[1] - neighbor[1])
        base_cost = 1.414 if (dx == 1 and dy == 1) else 1.0

        # Terrain cost (e.g. mud, river, hill)
        terrain_cost = terrain_types.get(neighbor, 0.0)

        # Threat cost (dangerous zones)
        threat_cost = enemy_threats.get(neighbor, 0.0) * 15.0 # Threat scaled heavily to force detour

        return base_cost + terrain_cost + threat_cost

    def find_path(self, start: Tuple[int, int], end: Tuple[int, int],
                  obstacles: List[Tuple[int, int]],
                  terrain_data: List[Dict], # List of dicts with x, y, cost
                  enemy_threats_list: List[Dict]) -> Tuple[List[Tuple[int, int]], float]:
        """
        Calculates the safest/shortest path using A*.
        Returns a list of coordinates representing the path and the total path cost.
        """
        start = tuple(start)
        end = tuple(end)
        
        # Convert lists to lookup maps
        obs_set = {tuple(obs) for obs in obstacles}
        
        terrain_map = {}
        for item in terrain_data:
            terrain_map[(item['x'], item['y'])] = float(item.get('cost', 0.0))

        threat_map = {}
        for item in enemy_threats_list:
            threat_map[(item['x'], item['y'])] = float(item.get('threat', 0.0))

        # A* algorithm implementation
        open_set = []
        heapq.heappush(open_set, (0.0, start))
        
        came_from = {}
        g_score = {start: 0.0}
        f_score = {start: self.heuristic(start, end)}

        in_open_set = {start}

        while open_set:
            _, current = heapq.heappop(open_set)
            in_open_set.remove(current)

            if current == end:
                # Reconstruct path
                path = []
                while current in came_from:
                    path.append(current)
                    current = came_from[current]
                path.append(start)
                path.reverse()
                return path, g_score[end]

            for neighbor in self.get_neighbors(current):
                step_cost = self.get_step_cost(current, neighbor, obs_set, terrain_map, threat_map)
                
                if step_cost == float('inf'):
                    continue

                tentative_g_score = g_score[current] + step_cost

                if tentative_g_score < g_score.get(neighbor, float('inf')):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_g_score + self.heuristic(neighbor, end)
                    
                    if neighbor not in in_open_set:
                        heapq.heappush(open_set, (f_score[neighbor], neighbor))
                        in_open_set.add(neighbor)

        # No path found
        return [], 0.0

if __name__ == "__main__":
    router = AStarGridRouter()
    # 15x15 test
    obstacles = [(1, 1), (1, 2), (1, 3)]
    terrain = [{'x': 2, 'y': 2, 'cost': 3.0}]
    threats = [{'x': 0, 'y': 2, 'threat': 0.9}]
    
    path, cost = router.find_path((0, 0), (3, 3), obstacles, terrain, threats)
    print("Test Pathfinder Path:", path)
    print("Test Pathfinder Cost:", cost)
