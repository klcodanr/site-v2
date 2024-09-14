/*
 * Copyright (c) 2011 - Crown Partners LLC
 * All Rights Reserved
 */
package com.crownpartners.cf;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.jcr.LoginException;
import javax.jcr.NoSuchWorkspaceException;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.PathNotFoundException;
import javax.jcr.Property;
import javax.jcr.PropertyIterator;
import javax.jcr.Repository;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.jcr.SimpleCredentials;
import javax.jcr.Value;

import org.apache.jackrabbit.commons.JcrUtils;
import org.htmlparser.Parser;
import org.htmlparser.Tag;
import org.htmlparser.lexer.Lexer;
import org.htmlparser.lexer.Page;
import org.htmlparser.visitors.NodeVisitor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Parses a JCR repository to find nodes that have properties or anchor tags
 * within properties that look like a certain path.
 * 
 * @author daniel.klco
 * @version 20110408
 */
public class ContentFinder {
	protected static Logger log = LoggerFactory.getLogger(ContentFinder.class);

	/**
	 * Write a message to the logs and to the system out.
	 * 
	 * @param message
	 *            the message to write
	 */
	public static void echo(String message) {
		System.out.println(message);
		log.info(message);
	}

	/**
	 * Write a message to the logs and to the system out.
	 * 
	 * @param message
	 *            the message to write
	 * @param throwable
	 *            the throwable to write
	 */
	public static void error(String message, Throwable throwable) {
		System.err.println(message + " " + throwable.getMessage());
		log.error(message, throwable);
	}

	/**
	 * Entrance point for the program.
	 * 
	 * @param args
	 *            the arguments to pass in to the program
	 * @throws Exception
	 *             an unexpected exception occurs
	 */
	public static void main(String[] args) throws Exception {
		log.trace("main");
		ContentFinder cf = new ContentFinder();
		cf.parseArgs(args);
		cf.start();
	}

	protected String root = "/content/goarmy";
	protected String[] prefix = new String[] { "/content" };
	protected String user = "admin";
	protected String pwd = "admin";
	protected String url = "http://localhost:4502/crx/server";
	protected String report = "report.csv";
	protected boolean skipFilter = false;
	protected OutputStream reportOS;
	protected OutputStream filterOS;
	protected String filter;
	protected Set<String> links = new HashSet<String>();
	protected boolean skipReport = false;

	/**
	 * Write the node-link pair to the file in CSV format.
	 * 
	 * @param node
	 *            the node where the link is found
	 * @param link
	 *            the link
	 * @throws RepositoryException
	 */
	protected void checkLink(Node node, String link) throws RepositoryException {
		log.trace("checkLink");

		log.debug("Removing extension if not in the DAM");
		if (link.contains(".") && !link.startsWith("/content/dam")) {
			link = link.substring(0, link.indexOf("."));
		}

		log.debug("Checking for node: " + node);
		if (!node.getSession().nodeExists(link)) {
			echo("Node at " + link + " not found");
			try {
				if (!skipReport) {
					log.debug("Writing report for: " + link);
					// write to regular report
					String path = node.getPath();
					path = path.substring(0, path.indexOf("/jcr:content"));
					reportOS.write((path + "," + link + "\n").getBytes("UTF-8"));
				}

				if (!skipFilter) {
					// add the link to the set of links
					if (link.contains("jcr:content")) {
						link = link.substring(0, link.indexOf("/jcr:content"));
					}
					if (!links.contains(link) && !parentFound(link)) {
						log.debug("Adding link to list");
						links.add(link);
					}
				}
			} catch (IOException e) {
				error("Exception writing to report", e);
			}
		} else {
			log.debug("Found node at: " + link);
		}
	}

	/**
	 * Check a property on the node.
	 * 
	 * @param node
	 *            the node, only used for reporting
	 * @param value
	 *            the string representation of the value of a property on the
	 *            node
	 * @throws RepositoryException
	 */
	protected void checkProperty(Node node, String value)
			throws RepositoryException {
		log.trace("checkProperty");

		log.trace("Checking value: " + value);
		for (int i = 0; i < prefix.length; i++) {
			if (value != null && value.startsWith(prefix[i])) {
				checkLink(node, value);
			}
		}
		if (value.contains("</a>")) {
			parseHTML(node, value);
		}
	}

	/**
	 * Returns true if any parent of the link is already in the set of links.
	 * 
	 * @param link
	 *            the link to check
	 * @return true if a parent of the link is already in the set of links,
	 *         false otherwise
	 */
	protected boolean parentFound(String link) {
		String parLink = link.substring(0, link.lastIndexOf("/"));
		while (parLink.length() > 1) {
			if (links.contains(parLink)) {
				return true;
			}
			parLink = parLink.substring(0, parLink.lastIndexOf("/"));
		}
		return false;
	}

	/**
	 * Parse the arguments passed in to the command line by the user.
	 * 
	 * @param args
	 *            the arguments for the program
	 */
	protected void parseArgs(String[] args) {
		log.trace("parseArgs");

		for (int i = 0; i < args.length; i++) {
			if ("-root".equals(args[i])) {
				root = args[++i];
				log.trace("Setting root: " + root);
			} else if ("-prefix".equals(args[i])) {
				prefix = args[++i].split(",");
				log.trace("Setting prefix: " + prefix);
			} else if ("-help".equals(args[i])) {
				log.trace("Displaying help message");
				echo("ContentFinder -root [Root of content] "
						+ "-prefix [Prefix of path to search for "
						+ "(separate multiple prefixes with ,)] -help "
						+ "-user [username] -password [password] "
						+ "-url [repository url ex: http://localhost:4502/crx/server] "
						+ "-report [report file|false] "
						+ "-root [JCR path of root node]"
						+ "-filter [filter file|false]");
				System.exit(0);
			} else if ("-user".equals(args[i])) {
				user = args[++i];
				log.trace("Setting user: " + user);
			} else if ("-password".equals(args[i])) {
				pwd = args[++i];
				log.trace("Setting password: " + pwd);
			} else if ("-url".equals(args[i])) {
				url = args[++i];
				log.trace("Setting repository url: " + url);
			} else if ("-report".equals(args[i])) {
				report = args[++i];
				if ("false".equals(report)) {
					log.trace("Skipping report");
					skipReport = true;
				} else {
					log.trace("Setting report: " + report);
				}
			} else if ("-filter".equals(args[i])) {
				filter = args[++i];
				if ("false".equals(filter)) {
					log.trace("Skipping filter");
					skipFilter = true;
				} else {
					log.trace("Creating filter in folder: " + filter);
				}
			}
			if (skipFilter && skipReport) {
				echo("So we're not creating a report or a filter... What's the point?");
				System.exit(1);
			}
		}
	}

	/**
	 * Parse the value of a HTML property.
	 * 
	 * @param node
	 *            the node the value is from
	 * @param html
	 *            a string representation of the property value
	 */
	protected void parseHTML(final Node node, String html) {

		// node visitor, will visit all a tags and check the href
		NodeVisitor linkVisitor = new NodeVisitor() {

			@Override
			public void visitTag(Tag tag) {
				String name = tag.getTagName();

				if ("a".equalsIgnoreCase(name)) {
					log.trace("Visiting link");
					String hrefValue = tag.getAttribute("href");
					log.trace("Found href: " + hrefValue);
					for (int i = 0; i < prefix.length; i++) {
						if (hrefValue != null
								&& hrefValue.startsWith(prefix[i])) {
							try {
								checkLink(node, hrefValue);
							} catch (RepositoryException e) {
								error("Exception writing report", e);
							}
						}
					}
				}
			}

		};

		try {
			log.debug("Parsing HTML");
			Parser parser = new Parser(new Lexer(new Page(html, "UTF-8")));
			parser.visitAllNodesWith(linkVisitor);
		} catch (Exception e) {
			error("Unable to parse HTML", e);
		}
	}

	/**
	 * Search the properties on the node as well as the jcr:content node below.
	 * 
	 * @param node
	 *            the node to search
	 * @throws RepositoryException
	 *             an exception occurs searching the node properties
	 */
	protected void searchNode(Node node) throws RepositoryException {
		try {
			echo("Checking node " + node.getPath());
			PropertyIterator properties = node.getProperties();
			while (properties.hasNext()) {
				Property prop = properties.nextProperty();
				if (prop.isMultiple()) {
					Value[] values = prop.getValues();
					for (int i = 0; i < values.length; i++) {
						checkProperty(node, values[i].getString());
					}
				} else {
					checkProperty(node, prop.getValue().getString());
				}
			}

			log.debug("Seaching child nodes.");
			NodeIterator nodes = node.getNodes();
			while (nodes.hasNext()) {
				searchNode(nodes.nextNode());
			}
		} catch (Exception e) {
			error("Unexpected exception processing node " + node.getPath(), e);
		}
	}

	/**
	 * Starts the program. Logs into the JCR and initializes all of the
	 * variables.
	 * 
	 * @throws Exception
	 *             an exception occurs
	 */
	protected void start() throws Exception {
		log.trace("start");

		Repository repository = null;
		Session session = null;

		try {
			log.debug("GetFactory Repository");
			echo("Connecting to " + url);
			repository = JcrUtils.getRepository(url);
			SimpleCredentials creds = new SimpleCredentials(user,
					pwd.toCharArray());
			echo("Logging with " + user + ":" + pwd);
			session = repository.login(creds, "crx.default");

			echo("Login Complete");
			// Useful if having trouble, seeing this value lets you know
			// that a connection has really been made.
			log.debug("Workspace: " + session.getWorkspace().getName());
		} catch (LoginException e) {
			error("Exception authenticating with repository, invalid credentials",
					e);
		} catch (NoSuchWorkspaceException e) {
			error("Exception authenticating with repository, no workspace", e);
			throw e;
		} catch (RepositoryException e) {
			error("Exception authenticating with repository", e);
			throw e;
		} catch (ClassCastException e) {
			error("Exception authenticating with repository", e);
			throw e;
		}

		echo("Opening report file");
		try {
			if (!skipReport) {
				File reportFile = new File(report);
				if (reportFile.exists()) {
					reportFile.delete();
				}
				reportOS = new FileOutputStream(reportFile);
			}
			if (!skipFilter) {
				File filterFile = new File("filter.xml");
				if (filterFile.exists()) {
					filterFile.delete();
				}
				filterOS = new FileOutputStream(filterFile);
				filterOS.write("<workspaceFilter vesion=\"1.0\">"
						.getBytes("UTF-8"));
			}
		} catch (IOException ioe) {
			error("Report file not found/could not be created", ioe);
			throw ioe;
		}

		echo("Retrieving root node");
		Node rootNode = null;
		try {
			rootNode = session.getNode(root);

			echo("Searching nodes");
			searchNode(rootNode);
		} catch (PathNotFoundException e) {
			error("Root node does not exist", e);
			throw e;
		} catch (RepositoryException e) {
			error("Unexpected exception getting root node", e);
			throw e;
		}
		if (!skipReport) {
			reportOS.close();
		}

		if (!skipFilter) {
			echo("Sorting list of links and removing duplicates");
			List<String> linksList = new ArrayList<String>();
			for (String link : links) {
				if (!parentFound(link)) {
					linksList.add(link);
				}
			}
			links = Collections.emptySet();
			Collections.sort(linksList);

			echo("Writing links to filter file");
			for (String link : linksList) {
				filterOS.write(("<filter root=\"" + link + "\"/>\n")
						.getBytes("UTF-8"));
			}

			filterOS.write("</workspaceFilter>".getBytes("UTF-8"));
			filterOS.close();
		}

		echo("Content Finder Complete");
	}
}