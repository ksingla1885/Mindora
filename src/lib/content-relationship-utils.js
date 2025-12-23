import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Types of content relationships
 */
export const RELATIONSHIP_TYPES = {
  PREREQUISITE: 'PREREQUISITE',
  RELATED: 'RELATED',
  DEPENDENCY: 'DEPENDENCY',
  ALTERNATIVE: 'ALTERNATIVE',
  PART: 'PART',
  VERSION: 'VERSION',
};

/**
 * Create a relationship between two content items
 * @param {string} sourceId - ID of the source content
 * @param {string} targetId - ID of the target content
 * @param {string} type - Type of relationship (from RELATIONSHIP_TYPES)
 * @param {object} [metadata] - Additional metadata for the relationship
 * @returns {Promise<object>} The created relationship
 */
export async function createContentRelationship(sourceId, targetId, type, metadata = {}) {
  // Validate relationship type
  if (!Object.values(RELATIONSHIP_TYPES).includes(type)) {
    throw new Error(`Invalid relationship type: ${type}`);
  }
  
  // Prevent self-referential relationships
  if (sourceId === targetId) {
    throw new Error('Cannot create a relationship between a content item and itself');
  }
  
  // Check if content items exist
  const [source, target] = await Promise.all([
    prisma.content.findUnique({ where: { id: sourceId } }),
    prisma.content.findUnique({ where: { id: targetId } }),
  ]);
  
  if (!source) throw new Error(`Source content not found: ${sourceId}`);
  if (!target) throw new Error(`Target content not found: ${targetId}`);
  
  // Check if relationship already exists
  const existing = await prisma.contentRelationship.findFirst({
    where: {
      sourceId,
      targetId,
      type,
    },
  });
  
  if (existing) {
    throw new Error('This relationship already exists');
  }
  
  // Create the relationship
  return prisma.contentRelationship.create({
    data: {
      source: { connect: { id: sourceId } },
      target: { connect: { id: targetId } },
      type,
      metadata,
    },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      target: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
    },
  });
}

/**
 * Get all relationships for a content item
 * @param {string} contentId - ID of the content item
 * @param {object} [options] - Query options
 * @param {string} [options.type] - Filter by relationship type
 * @param {boolean} [options.direction='outgoing'] - 'incoming', 'outgoing', or 'both'
 * @returns {Promise<Array>} Array of relationships
 */
export async function getContentRelationships(contentId, { type, direction = 'outgoing' } = {}) {
  const where = {};
  
  // Build the where clause based on direction
  if (direction === 'outgoing') {
    where.sourceId = contentId;
  } else if (direction === 'incoming') {
    where.targetId = contentId;
  } else if (direction === 'both') {
    where.OR = [
      { sourceId: contentId },
      { targetId: contentId },
    ];
  }
  
  // Filter by type if provided
  if (type) {
    where.type = type;
  }
  
  return prisma.contentRelationship.findMany({
    where,
    include: {
      source: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        },
      },
      target: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get a graph of related content
 * @param {string} contentId - ID of the starting content item
 * @param {object} [options] - Query options
 * @param {number} [options.depth=1] - How many levels deep to traverse
 * @param {string[]} [options.types] - Relationship types to include
 * @returns {Promise<object>} Graph of related content
 */
export async function getContentGraph(contentId, { depth = 1, types } = {}) {
  if (depth < 1 || depth > 5) {
    throw new Error('Depth must be between 1 and 5');
  }
  
  const visited = new Set();
  const queue = [{ id: contentId, depth: 0 }];
  const nodes = new Map();
  const links = [];
  
  // Get the starting node
  const startNode = await prisma.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
    },
  });  
  
  if (!startNode) {
    throw new Error('Content not found');
  }
  
  nodes.set(startNode.id, startNode);
  
  // Breadth-first traversal
  while (queue.length > 0) {
    const { id: currentId, depth: currentDepth } = queue.shift();
    
    if (currentDepth >= depth) continue;
    if (visited.has(currentId)) continue;
    
    visited.add(currentId);
    
    // Get all relationships for the current node
    const relationships = await prisma.contentRelationship.findMany({
      where: {
        OR: [
          { sourceId: currentId },
          { targetId: currentId },
        ],
        ...(types && types.length > 0 ? { type: { in: types } } : {}),
      },
      include: {
        source: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
          },
        },
        target: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
          },
        },
      },
    });
    
    // Process each relationship
    for (const rel of relationships) {
      const isSource = rel.sourceId === currentId;
      const otherNode = isSource ? rel.target : rel.source;
      
      // Add the other node to our nodes map if not already present
      if (!nodes.has(otherNode.id)) {
        nodes.set(otherNode.id, otherNode);
      }
      
      // Add the link
      links.push({
        source: isSource ? rel.sourceId : rel.targetId,
        target: isSource ? rel.targetId : rel.sourceId,
        type: rel.type,
        direction: isSource ? 'outgoing' : 'incoming',
        metadata: rel.metadata,
      });
      
      // Add to queue if not visited and within depth limit
      if (!visited.has(otherNode.id) && currentDepth + 1 < depth) {
        queue.push({ id: otherNode.id, depth: currentDepth + 1 });
      }
    }
  }
  
  return {
    nodes: Array.from(nodes.values()),
    links,
  };
}

/**
 * Remove a relationship between content items
 * @param {string} relationshipId - ID of the relationship to remove
 * @returns {Promise<object>} The deleted relationship
 */
export async function removeContentRelationship(relationshipId) {
  return prisma.contentRelationship.delete({
    where: { id: relationshipId },
  });
}

/**
 * Update a relationship's metadata
 * @param {string} relationshipId - ID of the relationship to update
 * @param {object} metadata - New metadata
 * @returns {Promise<object>} The updated relationship
 */
export async function updateContentRelationship(relationshipId, metadata) {
  return prisma.contentRelationship.update({
    where: { id: relationshipId },
    data: { metadata },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      target: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
    },
  });
}

/**
 * Check if a relationship exists between two content items
 * @param {string} sourceId - ID of the source content
 * @param {string} targetId - ID of the target content
 * @param {string} [type] - Optional relationship type to check for
 * @returns {Promise<boolean>} True if the relationship exists
 */
export async function relationshipExists(sourceId, targetId, type) {
  const where = {
    OR: [
      { sourceId, targetId },
      { sourceId: targetId, targetId: sourceId },
    ],
  };
  
  if (type) {
    where.type = type;
  }
  
  const count = await prisma.contentRelationship.count({ where });
  return count > 0;
}
